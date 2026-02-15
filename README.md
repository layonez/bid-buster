# Procurement Investigator

**One person. One command. $700 billion in public spending, audited.**

> *Built by a software engineer with zero procurement expertise. Claude Opus 4.6 helped research the domain, architect the tool, and now powers the investigations. This is what "Break the Barriers" looks like.*

> **Hackathon 2025 | Problem Statement #2: Break the Barriers** | [Sample Output](cases/fema-2026-02-12/README.md)

![Tests](https://img.shields.io/badge/tests-128%20passing-brightgreen) ![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue) ![License](https://img.shields.io/badge/license-MIT-green) ![Node](https://img.shields.io/badge/node-20%2B-339933) ![Lines](https://img.shields.io/badge/lines-~9%2C865-informational)

---

## It Works: FEMA COVID-19 Emergency Procurement

I pointed the tool at FEMA's 2020 pandemic procurement -- **7,259 contracts, zero prior knowledge of any specific vendor:**

```bash
investigate run --subtier-agency="Federal Emergency Management Agency" \
  --period=2020-01-01:2020-12-31 --deep --charts
```

The system independently flagged:

| Vendor | Amount | What Was Found | Later Validated By |
|--------|--------|---------------|------------|
| **Parkdale Mills** | $532M | Convergence: vendor concentration + price outlier | Largest FEMA sole-source gown contract |
| **Hanesbrands** | $175M | Convergence: concentration + price outlier | COVID emergency PPE reporting |
| **3M Company** | $96M | Price outlier in safety equipment | GAO Report GAO-20-632 |
| **GDIT** | $97M | Vendor concentration in IT services | Major FEMA IT contractor |

**1,465 signals -> 16 material findings** (92x noise reduction) | **2 convergence entities** (multi-indicator) | **36/36 claims verified** (100%) | **5.0 MB** git-committable case folder

> **The soda bottle test.** Fillakit LLC was formed 6 days before receiving a $10.16M FEMA contract for COVID test tubes. They shipped miniature soda bottles. Our system flags this automatically -- single-bid urgency pattern, no prior contract history, anomalous pricing. The Senate and DHS Inspector General later investigated the same company.
>
> [ProPublica: "The Trump Administration Paid Millions for Test Tubes -- and Got Unusable Mini Soda Bottles"](https://www.propublica.org/article/the-trump-administration-paid-millions-for-test-tubes-and-got-unusable-mini-soda-bottles)

---

## What Makes This Novel

1. **Opus 4.6 as Autonomous Investigator** -- Not a chatbot wrapper. The agent runs an independent investigation loop: 8 iterations, 35 tool calls, entity verification via SAM.gov, sanctions screening, comparative analysis -- and externalizes every thought via `log_reasoning` so you can read its reasoning like a detective's notebook.

2. **Self-Verifying AI** -- Every claim the agent makes must survive a verification pass against computed statistical evidence. The Verifier agent rejects unsupported assertions and catches tautological reasoning. Built-in quality gate that most AI tools lack.

3. **Investigation-as-Code** -- The entire audit methodology is codified, version-controlled, and reproducible. Every run produces a git-committable case folder with full provenance. Not locked in a PDF manual or institutional knowledge.

4. **Multi-signal convergence** -- When multiple independent statistical tests flag the same entity, that's a meaningful signal, not noise. Parkdale was flagged by both R004 (concentration) AND R006 (price outlier) independently.

5. **Three-tier AI architecture** -- Opus 4.6 for deep investigation ($4/case), Sonnet 4.5 for cost-efficient narrative enrichment ($0.10/case), template fallback for $0. Graceful degradation ensures accessibility at any budget.

6. **Open methodology** -- 6 indicators from recognized frameworks (OCP, OECD, GAO) with configurable thresholds. Not a black-box risk score.

---

## Quick Start

> **No API keys required** for the core experience. Signal detection, evidence generation, and verification all work at **$0 cost** with `--no-ai`.

### Prerequisites
- **Node.js 20+** (LTS)
- **npm**

### Install & Run

```bash
git clone https://github.com/AnsKaz-github/bid-buster.git && cd bid-buster && npm install

# Try it now -- no API key needed, $0 cost, ~2 minutes
npm run investigate -- run \
  --subtier-agency="Federal Emergency Management Agency" \
  --period=2020-01-01:2020-12-31 \
  --charts --no-ai

# Output: cases/fema-{date}/ -- open dashboard.html in your browser
```

```bash
# With AI investigation (requires ANTHROPIC_API_KEY in .env, ~$4/case)
npm run investigate -- run \
  --subtier-agency="Federal Emergency Management Agency" \
  --period=2020-01-01:2020-12-31 \
  --deep --charts
```

### Optional: AI Enhancement

```bash
# .env file in project root
ANTHROPIC_API_KEY=sk-ant-...          # Enables AI hypothesis enhancement + investigation agent
SAM_GOV_API_KEY=...                   # Optional: entity verification via SAM.gov
OPENSANCTIONS_API_KEY=...             # Optional: sanctions/PEP screening
```

| Flag | Purpose |
|------|---------|
| `--deep` | Enable Opus 4.6 investigative agent (~$4/case) |
| `--charts` | Generate Vega-Lite SVG charts |
| `--no-ai` | Skip all Claude API calls ($0, template-only) |
| `--with-transactions` | Enable R005 modification indicator |
| `--full-evidence` | Write complete per-entity evidence CSVs |

---

## The Personal Journey

I'm a software engineer. I had never worked in government contracting. Before this project, I didn't know what FAR 6.302 was or why single-bid rates matter.

Claude Opus 4.6 made this possible -- not just as a coding assistant, but as a domain research team. Multiple agents explored OECD bid-rigging methodology, the Open Contracting Partnership's 73-indicator catalogue, and GAO audit standards. Opus analyzed the [Cardinal-rs](https://github.com/open-contracting/cardinal-rs) Rust rule engine and we iterated together on a TypeScript adaptation of its fold/finalize architecture. It introduced me to the GAO Yellow Book's Five C's framework -- that's what gives every finding professional audit structure.

**That's the point.** The same AI that taught me the domain now runs the investigations. If a non-expert can build a professional-grade integrity screening tool in three days, imagine what journalists, watchdogs, and oversight offices can do with it.

---

## The Problem We Solve

Public procurement represents **one-third of government spending** -- ~$700 billion/year in the US alone. Identifying integrity risks currently requires:

- Deep institutional knowledge of audit methodology (GAO, OECD, World Bank)
- Access to expensive proprietary tools ($50K+/year licenses)
- Familiarity with complex procurement data schemas (FPDS-NG, USAspending)
- Statistical expertise to distinguish genuine anomalies from noise

**Before:** Hire a $200K/year forensic auditor with OECD methodology training.
**After:** `npm run investigate -- run --subtier-agency="FEMA" --period=2020-01-01:2020-12-31`

Built for [Anthropic's Hackathon 2025](https://lu.ma/Anthropic-Hackathon) | **Problem Statement #2: "Break the Barriers"** -- take something powerful that's locked behind expertise, cost, and infrastructure and put it in everyone's hands.

---

## Architecture

### 8-Agent Pipeline

```mermaid
flowchart TB
    CLI["investigate run --agency --period --deep --charts"]
    CLI --> COLLECT

    subgraph Pipeline["8-Step Investigation Pipeline"]
        direction TB
        COLLECT["1. COLLECTOR<br/>USAspending API<br/>Pagination + Cache + Normalize"]
        SIGNAL["2. SIGNALER<br/>6 Red-Flag Indicators<br/>fold/finalize pattern"]
        CONSOLIDATE["2.5 CONSOLIDATOR<br/>Signal Grouping<br/>Dollar-Weighted Materiality"]
        INVESTIGATE["3. INVESTIGATOR<br/>Claude Opus 4.6 Agent<br/>8 Tools + Reasoning Trace"]
        CONVERGE["3.5 CONVERGENCE<br/>Multi-Signal Analysis<br/>Cross-Indicator Correlation"]
        HYPOTHESIZE["4. HYPOTHESIS MAKER<br/>Non-Accusatory Questions<br/>Five C's Audit Structure"]
        PROVE["5. PROVER<br/>CSV Evidence Tables<br/>Vega-Lite SVG Charts"]
        ENHANCE["6. ENHANCER<br/>Claude Sonnet 4.5<br/>Per-Hypothesis Narrative"]
        REPORT["7. NARRATOR<br/>README + case.md<br/>Dashboard + Narrative"]
        VERIFY["8. VERIFIER<br/>Claim-Evidence Cross-Check<br/>Tautology Detection"]

        COLLECT --> SIGNAL
        SIGNAL --> CONSOLIDATE
        CONSOLIDATE --> INVESTIGATE
        INVESTIGATE --> CONVERGE
        CONVERGE --> HYPOTHESIZE
        HYPOTHESIZE --> PROVE
        PROVE --> ENHANCE
        ENHANCE --> REPORT
        REPORT --> VERIFY
    end

    VERIFY --> OUTPUT["Case Folder<br/>README.md + case.md + dashboard.html<br/>evidence/ + data/ + provenance.json"]

    style INVESTIGATE fill:#e8d5f5,stroke:#7c3aed
    style ENHANCE fill:#e8d5f5,stroke:#7c3aed
    style CONSOLIDATE fill:#fef3c7,stroke:#d97706
    style CONVERGE fill:#fef3c7,stroke:#d97706
    style VERIFY fill:#dcfce7,stroke:#16a34a
```

### Three-Tier AI Strategy

AI is integrated at **three tiers**, each using the right model for the job:

```mermaid
flowchart LR
    subgraph Tier1["Tier 1: Deep Investigation"]
        OPUS["Claude Opus 4.6<br/>Autonomous Agent"]
        TOOLS["8 Tools:<br/>log_reasoning | create_finding<br/>verify_entity | screen_sanctions<br/>fetch_comparable | get_detail<br/>get_subawards | summarize"]
        OPUS --> TOOLS
    end

    subgraph Tier2["Tier 2: Narrative Enhancement"]
        SONNET["Claude Sonnet 4.5<br/>Per-Hypothesis Enrichment"]
        EXEC["Executive Assessment<br/>AI Narrative for Briefing"]
        SONNET --> EXEC
    end

    subgraph Tier3["Tier 3: No AI Fallback"]
        TEMPLATE["Template Engine<br/>Works Without API Key"]
        RULES["Rule-Based Signals<br/>Deterministic Detection"]
        TEMPLATE --> RULES
    end

    style Tier1 fill:#f3e8ff,stroke:#7c3aed
    style Tier2 fill:#ede9fe,stroke:#8b5cf6
    style Tier3 fill:#f1f5f9,stroke:#64748b
```

| Tier | Model | Purpose | Cost |
|------|-------|---------|------|
| **Investigation** | Claude Opus 4.6 | Autonomous tool-calling agent: entity verification, sanctions screening, comparative analysis, transparent reasoning trace | ~$4/case |
| **Enhancement** | Claude Sonnet 4.5 | Per-hypothesis narrative enrichment + executive assessment | ~$0.10/case |
| **Fallback** | None (templates) | All signal detection + evidence is deterministic. Works without any API key. | **$0** |

### Investigative Agent Deep Dive

The Opus 4.6 agent operates as an autonomous investigator with **8 specialized tools**:

```mermaid
sequenceDiagram
    participant P as Pipeline
    participant A as Opus 4.6 Agent
    participant S as SAM.gov
    participant O as OpenSanctions
    participant D as USAspending

    P->>A: Material findings + awards data
    A->>A: log_reasoning: "Parkdale has $532M across 3 awards..."
    A->>S: verify_entity("Parkdale Mills")
    S-->>A: Entity registration data
    A->>A: log_reasoning: "Entity verified, checking sanctions..."
    A->>O: screen_sanctions("Parkdale Mills")
    O-->>A: No sanctions matches
    A->>D: fetch_comparable_awards(NAICS: 423450)
    D-->>A: Peer group comparison data
    A->>A: create_finding: Five C's structured finding
    A->>A: log_reasoning: "Moving to next entity..."
    Note over A: Repeats for each flagged entity (8 iterations, 35 tool calls)
    A->>P: Investigation findings + reasoning trace
```

Every thought, hypothesis, and dead end is recorded and rendered as `investigation-narrative.md` -- full transparency into the AI's reasoning process.

---

## Red-Flag Indicators

Six indicators based on the [OCP Red Flags Guide](https://www.open-contracting.org/resources/red-flags-in-public-procurement/) (73 indicators) and [OECD Bid Rigging Guidelines](https://www.oecd.org/en/publications/2025/09/):

| ID | Indicator | What It Detects | Example |
|----|-----------|-----------------|---------|
| R001 | **Single-Bid Competition** | Open tenders with only 1 bidder | Fillakit LLC: nominally competitive, but only 1 offer |
| R002 | **Non-Competitive Awards** | Awards bypassing open competition | AirBoss: $96M "NOT COMPETED / ONLY ONE SOURCE" |
| R003 | **Contract Splitting** | Award clusters near regulatory thresholds | Multiple awards just under $250K from same vendor |
| R004 | **Vendor Concentration** | One supplier dominating agency spend | Parkdale: $532M = dominant share of FEMA gowns |
| R005 | **Excessive Modifications** | Contracts ballooning post-award | >5 modifications or >2x cost growth |
| R006 | **Price Outliers** | Abnormally expensive awards vs. peers | $96M AirBoss as statistical outlier in NAICS category |

**Signal-to-Finding Pipeline:**

```mermaid
flowchart LR
    RAW["1,465 Raw Signals"]
    GROUP["Group by Entity<br/>+ Indicator"]
    SCORE["Dollar-Weighted<br/>Materiality Score"]
    CAP["Per-Indicator Caps<br/>(max 5 each)"]
    RANK["Top-N Material<br/>Findings"]
    CONVERGE["Convergence<br/>Analysis"]

    RAW --> GROUP --> SCORE --> CAP --> RANK --> CONVERGE

    RANK --> |"16 Findings"| OUTPUT["Material Findings<br/>with Five C's Structure"]
    CONVERGE --> |"2 Entities"| MULTI["Multi-Indicator<br/>Convergence Entities"]

    style OUTPUT fill:#dcfce7,stroke:#16a34a
    style MULTI fill:#fef3c7,stroke:#d97706
```

---

## Output: Professional Case Folder

Every investigation produces a **self-contained, git-committable** case folder (5.0 MB for FEMA):

```
cases/fema-{date}/
├── README.md                            Executive briefing (top findings in plain English)
├── case.md                              Full report (<50 KB, inverted pyramid structure)
├── dashboard.html                       Interactive dashboard (277 KB)
├── investigation-narrative.md           Agent reasoning trace (--deep)
├── provenance.json                      Full audit trail (git commit, timestamps, hashes)
├── data/                                Machine-readable JSON (signals, findings, verification)
└── evidence/
    ├── summary/                         Entity-scoped CSV evidence tables
    ├── charts/                          SVG visualizations (4 chart types)
    └── detail/                          Complete per-entity CSVs (--full-evidence)
```

### Five C's Audit Structure (GAO Yellow Book)

Every material finding follows professional audit standards:

| Component | What It Contains | Example |
|-----------|-----------------|---------|
| **Condition** | Specific quantified metric | "Parkdale received $532M across 3 FEMA awards (8.2% of portfolio)" |
| **Criteria** | Standard being compared against | "FAR 6.101 requires full and open competition; OCP flags >30% concentration" |
| **Cause** | Available justification data | "Awards coded as NOT COMPETED / URGENCY (FAR 6.302-2)" |
| **Effect** | Dollar amount at risk | "$532M in potentially non-competitive spending" |
| **Recommendation** | Concrete follow-up action | "Review sole-source justification documents for awards X, Y, Z" |

---

## Ethical Framework

**Red flags are not proof of wrongdoing.** They are screening indicators that identify patterns warranting further review. This principle is enforced structurally:

```mermaid
flowchart TB
    subgraph Principles["Core Principles"]
        P1["Screening, Not Accusation<br/>Every report opens with disclaimer"]
        P2["Non-Accusatory Language<br/>Questions, not conclusions"]
        P3["Transparent Methodology<br/>All thresholds documented"]
        P4["Public Data Only<br/>No sensitive-level access"]
        P5["Self-Verifying<br/>Every claim must pass verification"]
    end

    subgraph Enforcement["How It's Enforced"]
        E1["Verifier Agent rejects<br/>unsupported claims"]
        E2["Templates hardcoded<br/>with question framing"]
        E3["AI system prompts require<br/>non-accusatory tone"]
        E4["Tautology detection<br/>catches structural bias"]
    end

    P1 --- E1
    P2 --- E2
    P3 --- E3
    P5 --- E4

    style Principles fill:#f0fdf4,stroke:#16a34a
    style Enforcement fill:#eff6ff,stroke:#2563eb
```

---

## Technology Stack

| Concern | Choice | Why |
|---------|--------|-----|
| Language | **TypeScript** (strict, ESM) | Type safety, modern ecosystem |
| Runtime | **Node.js 20+** | LTS, native fetch |
| AI | **@anthropic-ai/sdk** | Claude Opus 4.6 + Sonnet 4.5 |
| CLI | **commander** | Most popular, excellent TS types |
| Validation | **zod** | Runtime schema validation for API data |
| HTTP | **Native fetch + p-retry + p-throttle** | Lightweight; backoff + rate limiting |
| Statistics | **simple-statistics** | IQR/percentile for indicator computation |
| Charts | **vega + vega-lite** | Reproducible SVG specs, server-side rendering |
| Testing | **vitest** | Fast, ESM-native, 128 tests in < 1 second |

---

## Development

```bash
npm install          # Install dependencies
npm test             # Run 128 unit tests
npm run typecheck    # TypeScript strict check (zero errors)
npm run dev -- --help # Run CLI in dev mode
```

### Project Structure

```
src/
├── cli/              # CLI entry point + 3 commands (run, fetch, signal)
├── collector/        # USAspending API client + cache + normalization
├── normalizer/       # Raw JSON -> canonical schema (zod-validated)
├── signaler/         # 6 red-flag indicators + consolidator + convergence
├── enrichment/       # SAM.gov + OpenSanctions + sub-awards clients
├── investigator/     # Opus 4.6 autonomous agent (8 tools, 786 lines)
├── hypothesis/       # Template + AI generation + Five C's audit structure
├── prover/           # CSV evidence tables + Vega-Lite chart specs
├── narrator/         # Reports + dashboard + briefing + AI narrative
├── verifier/         # Claim-evidence cross-check + tautology detection
├── orchestrator/     # 8-step pipeline orchestration
└── shared/           # Types, logger, filesystem, provenance
```

---

## Hackathon Alignment

| | |
|---|---|
| **Problem Statement** | #2 "Break the Barriers" -- expert procurement audit in everyone's hands |
| **Open Source** | MIT License, all components |
| **New Work** | Built from scratch in ~3 days (see git history) |
| **Team** | 1-2 members |
| **Claude Models** | Opus 4.6 (research + investigation agent) + Sonnet 4.5 (narrative) + $0 fallback |

---

## References

- [Open Contracting Partnership Red Flags Guide (2024)](https://www.open-contracting.org/resources/red-flags-in-public-procurement/) -- 73 indicators catalogue
- [OECD Guidelines for Fighting Bid Rigging (2025)](https://www.oecd.org/en/publications/2025/09/) -- Competition analysis methodology
- [GAO Yellow Book (Government Auditing Standards)](https://www.gao.gov/yellowbook) -- Five C's finding structure
- [GAO Report GAO-20-632](https://www.gao.gov/assets/gao-20-632.pdf) -- GAO's COVID-19 contracting analysis
- [USAspending API](https://api.usaspending.gov) -- Public federal spending data
- [OCP Cardinal Library](https://github.com/open-contracting/cardinal-rs) -- fold/finalize pattern inspiration

---

## License

MIT

---

*The same AI that taught me procurement methodology now runs the investigations. Built with Claude Opus 4.6 + Sonnet 4.5. Open source. Investigation-as-Code.*
