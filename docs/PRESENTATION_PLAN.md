# Hackathon Presentation Plan (15 minutes)

> **Problem Statement #2: "Break the Barriers"**
> Expert procurement audit methodology in everyone's hands.

---

## Opening Hook (1 min)

> "Public procurement is one-third of government spending. During COVID-19, FEMA awarded $11.5 billion in 7,259 emergency contracts in 10 months. How do you know if that money was spent properly? Today, professional auditors at GAO and Inspector General offices use red-flag indicators — but that expertise is locked behind expensive tools and institutional knowledge. We built a tool that puts investigation-grade procurement analysis in everyone's hands. One command. Real data. Verified results."

**Show the command:**
```bash
investigate run --subtier-agency="Federal Emergency Management Agency" \
  --period=2020-03-01:2020-12-31 --deep --charts
```

---

## Part 1: The Blind Discovery (3 min)

**Key message:** Zero prior knowledge, one command, the system independently surfaces the most important patterns.

1. **Open `cases/fema-2026-02-12/README.md`**
   - AI-generated narrative at the top (point out `[AI-GENERATED]` tag)
   - "At a Glance" table: 7,259 awards, 1,465 signals, 16 material findings, $3.98B exposure
   - **Multi-Signal Entities**: Parkdale and Hanesbrands flagged by 2 independent indicators
   - This is the entry point — one page, plain English, the story

2. **Walk through the top finding:**
   - Parkdale Advanced Materials: $543M across 2 non-competitive awards
   - Click the USAspending link — show it goes to the real federal data source
   - "This was 60 million reusable gowns for the COVID-19 national emergency"

3. **The punchline:**
   - "Parkdale's $532M gown contract is 56.8 standard deviations above comparable awards. Our system found it automatically — along with Hanesbrands' $175M, 3M's DPA respirator orders, and a 45.6% single-bid rate across the portfolio."

---

## Part 2: The AI Investigation (4 min)

**Key message:** This isn't just statistics — an AI agent conducts a genuine investigation.

1. **Open `cases/fema-2026-02-12/investigation-narrative.md`**
   - Walk through the 4 reasoning steps:
     - Step 1: Agent forms hypothesis from award ID patterns — "likely FEMA, COVID-19 PPE cluster"
     - Step 2: Confirms by reading award descriptions — "60 MILLION REUSABLE GOWNS"
     - Step 3: Distinguishes emergency PPE (expected) from IT contracts (different concern)
     - Step 4: Identifies Defense Production Act orders for 3M, NAICS concentration analysis
   - "The agent made 28 tool calls across 8 iterations — looking up individual awards, running statistical analyses, attempting entity verification via SAM.gov"
   - "It correctly concluded the urgency justification is appropriate for a declared emergency, while noting the scale still warrants price reasonableness review"

2. **The key insight:**
   - "This is what separates our tool from a SQL query. The AI doesn't just flag numbers — it investigates context, distinguishes legitimate emergency procurement from genuine anomalies, and explains its reasoning in a transparent, auditable trail."

---

## Part 3: The Dashboard (3 min)

**Key message:** Interactive, visual, professional — every finding is explorable.

1. **Open `cases/fema-2026-02-12/dashboard.html` in browser**
   - Executive summary cards: 1,465 signals, 712 high, 7,259 awards, 36/36 verified (green badge)
   - **Charts** (scroll to Visual Evidence):
     - "Who Got the Money?" — Parkdale's red bar dominates (non-competitive)
     - "When Did the Money Flow?" — April 2020 spike visible
     - "How Competitive Was the Spending?" — Not Competed dominates by dollar value
     - "What Should Be Investigated?" — Findings ranked by exposure
   - **Material Findings**: Click into Parkdale — full Five C's (Condition, Criteria, Cause, Effect, Recommendation)
   - **Hypotheses**: Point out `[AI-ENHANCED]` tags — Sonnet-generated analytical narratives
   - **Verification badge**: "36 out of 36 claims verified. Every number in this report is cross-checked."

---

## Part 4: Investigation-as-Code (2 min)

**Key message:** Reproducible, verifiable, git-committable.

1. **Show the folder structure:**
   ```
   cases/fema-2026-02-12/        # 3.2 MB — git-committable
   ├── README.md                  # 1-page briefing (start here)
   ├── case.md                    # Full report with Five C's
   ├── dashboard.html             # Interactive dashboard
   ├── investigation-narrative.md # AI reasoning trace
   ├── evidence/                  # 22 CSVs + 4 SVG charts
   ├── data/                      # Machine-readable JSON
   └── provenance.json            # Git commit, file hashes, parameters
   ```

2. **Provenance:**
   - "Every run records the git commit, parameters, data source, and SHA-256 hashes"
   - "You can re-run the exact same command and get the same results — because the API data is cached"
   - "This is what Investigation-as-Code means: findings you can version, diff, and audit"

3. **Quick second case (DoD-MIT):**
   - "Same tool, different domain. DoD procurement for MIT — 10,000 awards"
   - "The agent identified MITRE as an FFRDC, explained Foreign Military Sales patterns, found contract splitting near regulatory thresholds"
   - "54/54 verification. Different dataset, same rigor."

---

## Part 5: Architecture & AI Usage (2 min)

**Key message:** Claude at every layer — from investigation to narrative to verification.

1. **8-step pipeline:**
   ```
   Collect → Signal → Investigate → Hypothesize → Prove → Enhance → Report → Verify
                         ↑ Opus 4.6            ↑ Sonnet         ↑ Sonnet
   ```

2. **Three layers of AI:**
   - **Opus 4.6 Investigator** (--deep): Autonomous agent with 8 tools — entity verification, statistical analysis, award lookup, reasoning log. Makes decisions about what to investigate next.
   - **Sonnet Enhancer**: Per-hypothesis narrative enrichment. Transforms template questions into contextual analysis with innocent explanations and next steps.
   - **Sonnet Narrator**: Executive summary paragraph at the top of README.md — synthesizes the entire investigation into 3-5 sentences.

3. **Non-accusatory by design:**
   - "Every template uses question form. The AI system prompt requires balanced framing. The verifier checks for disclaimers. We never say 'fraud' — we say 'warrants review.'"

---

## Closing & Q&A (1 min)

> "We pointed our tool at 7,259 FEMA emergency contracts. Zero prior knowledge. One command. It independently found the largest vendors, identified the COVID-19 context, distinguished legitimate emergency procurement from patterns worth investigating, and produced a verified, git-committable case file. This is Investigation-as-Code — expert procurement audit methodology in everyone's hands."

**Stats to have ready:**
- 47 TypeScript files, ~7,600 lines, 128 tests
- 6 red-flag indicators (OECD/OCP methodology)
- 2 demo cases: FEMA COVID-19 (7,259 awards) + DoD-MIT (10,000 awards)
- 100% verification on both cases
- 3.2 MB / 2.6 MB git-committable folders
- Opus 4.6 + Sonnet: ~$4-5 per full investigation

---

## Anticipated Judge Questions

| Question | Answer |
|----------|--------|
| "How do you handle false positives?" | The agent correctly identified COVID PPE as expected emergency procurement. Five C's "Cause" always includes innocent explanations. Non-accusatory framing is structural, not just prompting. |
| "What makes this different from SQL?" | The Opus agent forms hypotheses, follows leads across data sources, recognizes domain patterns (DPA, FFRDC, FMS), and writes narrative explanations. Show investigation-narrative.md. |
| "Can it work on other datasets?" | Architecture is dataset-agnostic. We demonstrated 2 different domains (emergency management, defense R&D). Indicators are configurable. OCDS international format is on the roadmap. |
| "How is AI used?" | Three layers: Opus 4.6 for investigation (tool-calling agent), Sonnet for narrative enhancement, Sonnet for executive summaries. All with graceful fallback — `--no-ai` produces template-only output. |
| "How do you ensure accuracy?" | 8th pipeline step: verifier cross-checks every claim against computed data. 36/36 and 54/54 on our demo cases. Provenance with SHA-256 hashes. |
| "What's the cost?" | ~$4-5 per full investigation with --deep. $0 with --no-ai (rule-engine only). |
| "Is the data real?" | 100% real. USAspending.gov public API. Every finding links to the source. Click any USAspending link to verify. |

---

## Demo Files Checklist

- [ ] `cases/fema-2026-02-12/dashboard.html` opens in browser
- [ ] `cases/fema-2026-02-12/README.md` readable in any markdown viewer
- [ ] `cases/fema-2026-02-12/investigation-narrative.md` ready to screen-share
- [ ] `cases/dod-mit-2026-02-12/dashboard.html` as backup
- [ ] Terminal with the `investigate run` command ready to show (don't run live — use cached output)
- [ ] USAspending links work (test one: https://www.usaspending.gov/award/CONT_AWD_70FB7020F00000080_7022_70FB7020D00000013_7022)
