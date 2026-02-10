# Procurement Investigator

**Investigation-as-Code:** Turn public spending data into auditable integrity reports.

One command transforms USAspending procurement data into a professional case file with red-flag signals, non-accusatory hypotheses, AI-enhanced executive assessments, and full provenance -- all reproducible and git-committable.

## Quick Start

```bash
# Install
npm install

# Run a full investigation
npx investigate run \
  --agency="Department of Defense" \
  --recipient="MASSACHUSETTS INSTITUTE OF TECHNOLOGY" \
  --period=2023-01-01:2023-12-31

# Output: cases/case-YYYY-MM-DD/
#   case.md           - Full investigation report
#   signals.json      - Red-flag signal data
#   hypotheses.json   - Generated hypotheses
#   verification.json - Claim verification results
#   awards.json       - Normalized procurement data
#   provenance.json   - Audit trail
```

## What It Does

```
investigate run --agency=<name> --period=<start:end> [--recipient=<name>]
```

The tool runs a 5-step pipeline:

1. **Collect** -- Fetches award data from USAspending API (pagination, caching, detail enrichment)
2. **Signal** -- Computes 6 red-flag indicators based on OCP/OECD methodology
3. **Hypothesize** -- Generates non-accusatory hypotheses + AI executive assessment (Claude)
4. **Report** -- Assembles `case.md` with disclaimer, signals, hypotheses, methodology, provenance
5. **Verify** -- Cross-checks every claim in the report against computed evidence

## Red-Flag Indicators

| ID | Indicator | What It Detects |
|----|-----------|-----------------|
| R001 | Single-Bid Competition | Competitive tenders with only 1 bidder |
| R002 | Non-Competitive Awards | Awards bypassing open competition |
| R003 | Contract Splitting | Award clusters near regulatory thresholds |
| R004 | Vendor Concentration | One supplier dominating agency spend |
| R005 | Excessive Modifications | Contracts ballooning post-award |
| R006 | Price Outliers | Abnormally expensive awards vs peers |

All thresholds configurable via `config/default.yaml`. Based on the [OCP Red Flags Guide](https://www.open-contracting.org/resources/red-flags-in-public-procurement/) (73 indicators) and [OECD Bid Rigging Guidelines](https://www.oecd.org/en/publications/2025/09/) (2025).

## Commands

```bash
# Full investigation pipeline
investigate run --agency="Agency Name" [--recipient="Name"] --period=YYYY-MM-DD:YYYY-MM-DD

# Data collection only
investigate fetch --agency="Agency Name" [--with-details] [--with-transactions]

# Run signals on cached data
investigate signal --input=.cache/normalized/awards.json [--format=json]
```

**Global options:** `--config <path>`, `--output <dir>`, `--verbose`, `--no-cache`

## Architecture

```
CLI (commander)
  │
  ▼
Orchestrator ──→ 5-step pipeline
  │
  ├─ 1. Collector    → USAspending API (fetch, paginate, cache)
  ├─ 2. Signaler     → 6 indicators (fold/finalize pattern)
  ├─ 3. Hypothesis   → Templates + Claude AI enhancement
  ├─ 4. Narrator     → case.md assembly with footnotes
  └─ 5. Verifier     → Claim ↔ evidence cross-check
```

**Multi-agent design** with clear separation of concerns. Each agent can be run independently or as part of the full pipeline.

## AI Enhancement

With `ANTHROPIC_API_KEY` set, the Hypothesis Maker calls Claude to generate an executive assessment that:
- Interprets signal patterns across the dataset
- Suggests innocent explanations alongside risk interpretations
- Recommends what reviewers should prioritise
- Maintains strictly non-accusatory language

Without an API key, the tool falls back to template-based hypotheses -- still fully functional.

## Configuration

All indicator thresholds are configurable in `config/default.yaml`:

```yaml
signals:
  R001_single_bid:
    enabled: true
    severityThreshold: 0.20    # >20% single-bid rate = high severity

  R004_concentration:
    vendorShareThreshold: 0.30 # Flag if vendor has >30% of agency spend

  R006_price_outliers:
    method: "iqr"              # IQR or z-score
    iqrMultiplier: 1.5         # Standard outlier detection
```

## Data Source

**USAspending API** (https://api.usaspending.gov) -- no authentication required. Covers all U.S. federal contract awards from FY2008 onward.

## Ethical Framework

- **Screening, not accusation.** Every report opens with a disclaimer
- **Non-accusatory language.** Hypotheses use question form
- **Transparent methodology.** All thresholds and data coverage documented
- **Public data only.** No sensitive-level API access
- **Reproducible.** Every run produces `provenance.json` with git commit hash

## Development

```bash
npm install          # Install dependencies
npm test             # Run 24 unit tests
npm run typecheck    # TypeScript strict check
npm run dev -- --help # Run CLI in dev mode
```

## Tech Stack

TypeScript (strict ESM) | commander | zod | vitest | pino | @anthropic-ai/sdk | simple-statistics | p-retry + p-throttle

## License

MIT

---

*Built for Anthropic's Hackathon 2025. Open source. Investigation-as-Code.*
