# Demo Video Script: Procurement Investigator (3 minutes)

> **Format:** Screen recording with live narration (confident storyteller, "I" voice)
> **Pacing:** ~150 words/min spoken. Total: ~470 words + screen transitions.
> **Vibe:** Chill conference lightning talk. Not hype-y, not corporate. "Let me show you something cool."
> **Setup:** Terminal + browser tabs pre-loaded (dashboard, README, investigation-narrative)

---

## Pre-Recording File Setup

Open these tabs/files **before** recording:

| Tab # | What to Open | How |
|-------|-------------|-----|
| 1 | Terminal | Dark theme, 16pt+ font, command pre-typed |
| 2 | FEMA case README | VS Code or Markdown preview: `cases/fema-2026-02-12/README.md` |
| 3 | Investigation narrative | VS Code: `cases/fema-2026-02-12/investigation-narrative.md` |
| 4 | FEMA dashboard | Browser: `cases/fema-2026-02-12/dashboard.html` |
| 5 | Fillakit evidence CSV | VS Code: `cases/fema-2026-02-12/evidence/summary/F-R001-DEPAR-OF-SINGLEBID-competition-data.csv` |
| 6 | DoD-MIT dashboard | Browser: `cases/dod-mit-2026-02-12/dashboard.html` |
| 7 | VS Code project | `src/` folder tree visible |

---

## ACT 1: THE PERSONAL HOOK (0:00 - 0:35)

**[TIME: 0:00-0:15]**
**[SHOW: Terminal. Command pre-typed, cursor blinking:]**
```
npm run investigate -- run \
  --subtier-agency="Federal Emergency Management Agency" \
  --period=2020-01-01:2020-12-31 \
  --deep --charts
```

> "I'm a software engineer. I know nothing about government procurement. But I wanted to see if I could build a tool that does what a two-hundred-thousand-dollar-a-year forensic auditor does -- using public data and AI."

**[SHOW: Hit enter. Pipeline starts scrolling -- COLLECT, SIGNAL, CONSOLIDATE, INVESTIGATE, PROVE, VERIFY -- each step ticking.]**

> "I started with Opus 4.6 as my research team. Multiple agents surveying open-source tools in the space -- Cardinal-rs, OCDSKit, Kingfisher Collect -- exploring OECD bid-rigging methodology, the Open Contracting Partnership's red-flag indicators, GAO audit standards. Opus analyzed a Rust rule engine and we iterated together on a TypeScript architecture. That research became the foundation."

**[TIME: 0:15-0:35]**
**[SHOW: Switch to Tab 2 — FEMA case README]**
> **FILE:** `cases/fema-2026-02-12/README.md`
> **SEARCH:** `At a Glance` (line 13 — shows the stats table: 7,259 awards, 1,465 signals, 16 findings)

> "Built the tool in about three days. Pointed it at FEMA's 2020 COVID emergency procurement -- seven thousand contracts, completely blind."

**[SHOW: Scroll down slightly]**
> **SEARCH:** `Multi-Signal Entities` (line 23 — Parkdale and Hanesbrands convergence table)

> "Parkdale Advanced Materials: five hundred thirty-two million dollars. Hanesbrands: a hundred seventy-five million. Both flagged by two independent indicators -- the tool surfaced them automatically."

---

## ACT 2: THE AI INVESTIGATOR (0:35 - 1:15)

**[TIME: 0:35-0:55]**
**[SHOW: Switch to Tab 3 — Investigation narrative. Scroll slowly.]**
> **FILE:** `cases/fema-2026-02-12/investigation-narrative.md`
> **SEARCH:** `Step 1: Forming Hypothesis` (line 8 — top of reasoning trace)

> "Here's where it gets interesting. Opus 4.6 doesn't just flag numbers. It runs an actual investigation -- it loops through the flagged findings, forms hypotheses, follows leads across government databases, and writes down every thought so you can read its reasoning like a detective's notebook."

**[SHOW: Highlight the key insight in Step 1]**
> **SEARCH:** `strongly suggesting COVID-19 emergency procurement` (line 13)

> "Step one: from award IDs and industry codes alone, it deduced this was COVID PPE procurement -- before reading a single contract description."

**[TIME: 0:55-1:05]**
**[SHOW: Scroll to Step 2]**
> **SEARCH:** `DELIVERY ORDER FOR 60 MILLION REUSABLE GOWNS` (line 34)

> "Step two: confirmed. Sixty million reusable gowns. It verified the urgency justification, spotted the Defense Production Act orders for 3M."

**[TIME: 1:05-1:15]**
**[SHOW: Scroll to Step 4]**
> **SEARCH:** `most concentration findings reflect legitimate market structure` (line 86)

> "And this is what I love -- it doesn't just flag everything as suspicious. It concluded that RAND's concentration is expected for a federally-funded research center. That American Medical Response dominates because they're the largest national ambulance company. The AI distinguishes real risk from noise."

---

## ACT 3: THE OUTPUT (1:15 - 1:55)

**[TIME: 1:15-1:30]**
**[SHOW: Switch to Tab 4 — FEMA dashboard in browser. Let it load.]**
> **FILE:** `cases/fema-2026-02-12/dashboard.html` (open in browser)
> **VISIBLE:** Executive Summary section — summary cards showing `1465` Signals, `7259` Awards, `36/36` Claims Verified (green card)

> "Every investigation produces a full case folder. Interactive dashboard, visual evidence, everything git-committable."

**[SHOW: Scroll down to charts section]**
> **SEARCH:** `Who Got the Money?` (chart title — top vendors bar chart, color-coded by competition)

> "Parkdale's bar -- non-competitive, in red. You can see the scale immediately."

**[SHOW: Glance at next chart]**
> **SEARCH:** `When Did the Money Flow?` (chart title — timeline with April 2020 spike)

> "The April 2020 spike. The gap between competed and sole-source spending. All generated automatically."

**[TIME: 1:30-1:45]**
**[SHOW: Scroll to Material Findings section in dashboard]**
> **SEARCH:** `Non-Competitive Awards — PARKDALE` (finding card title)
> **VISIBLE:** The Five C's structure: Condition, Criteria, Cause, Effect, Recommendation

> "Every finding follows a professional audit structure -- Condition, Criteria, Cause, Effect, Recommendation. That's the GAO Yellow Book's Five C's framework. Opus taught me it existed during the research phase. Now the tool generates it automatically for every finding."

**[TIME: 1:45-1:55]**
**[SHOW: Switch to Tab 6 — DoD-MIT dashboard. Quick flash.]**
> **FILE:** `cases/dod-mit-2026-02-12/dashboard.html` (open in browser)
> **VISIBLE:** Executive Summary cards showing `10000` Awards Analyzed

> "Same tool, different domain. Department of Defense, ten thousand awards. GlaxoSmithKline billion-dollar outlier. Different data, same rigor."

---

## ACT 4: THE REAL STORY (1:55 - 2:30)

**[TIME: 1:55-2:15]**
**[SHOW: Switch to Tab 5 — Fillakit evidence CSV in VS Code]**
> **FILE:** `cases/fema-2026-02-12/evidence/summary/F-R001-DEPAR-OF-SINGLEBID-competition-data.csv`
> **SEARCH:** `FILLAKIT` (line 36 — shows: award ID, FILLAKIT LLC, $10,160,000, single bid)

> "But let me tell you what makes this real. Fillakit LLC -- a company formed six days before getting a ten million dollar FEMA contract for COVID test tubes. They shipped miniature soda bottles instead. ProPublica investigated. The Senate investigated. The Inspector General investigated."

**[SHOW: Point at the row — single bid, $10M]**

> "The tool catches that pattern automatically from public data. Single-bid competition, ten million dollars, flagged."

**[TIME: 2:15-2:30]**
**[SHOW: Switch back to Tab 4 — FEMA dashboard. Scroll to top.]**
> **FILE:** `cases/fema-2026-02-12/dashboard.html`
> **VISIBLE:** The green `36/36` Claims Verified card in Executive Summary

> "And every claim in the report is automatically cross-checked against the underlying data. Thirty-six out of thirty-six verified. Nothing slips through unverified. The AI has a quality gate -- if a claim isn't backed by computed evidence, the verifier rejects it."

---

## ACT 5: THE CLOSE (2:30 - 2:55)

**[TIME: 2:30-2:45]**
**[SHOW: Switch to Tab 7 — VS Code with src/ folder tree. Then split-terminal: `npm test`]**
> **VISIBLE:** `src/` folder tree (47 files), then `128 tests passing` in terminal

> "Here's the full picture. Opus 4.6 helped me research a domain I knew nothing about. I built the tool in three days. And now that same Opus runs inside the tool as an autonomous investigator -- it loops through findings, follows leads across SAM.gov and sanctions databases, and writes down every thought so humans can audit the AI's work."

**[TIME: 2:45-2:55]**
**[SHOW: Back to Tab 1 — terminal. Clean shot of the command.]**

> "The same AI that taught me procurement methodology now runs the investigations. Works without AI too, at zero cost. That's what breaking the barriers looks like. One command. Real data. Verified results. Procurement Investigator."

**[SHOW: Title card -- "Procurement Investigator" / "Investigation-as-Code" / MIT License / GitHub URL]**

---

## Production Notes

### Pre-Recording Checklist
- [ ] Terminal: dark theme, 16pt+ font, clean prompt
- [ ] Pre-run the FEMA case (output cached -- instant replay of pipeline steps)
- [ ] Browser tabs ready: `dashboard.html` (FEMA + DoD-MIT)
- [ ] VS Code: `investigation-narrative.md`, `competition-data.csv`, `src/` folder
- [ ] Practice the narration 2-3 times -- aim for relaxed, not rushed
- [ ] Record in a quiet space, decent mic
- [ ] Test Cmd+F search for each `SEARCH:` string below before recording

### Quick-Reference: All Search Strings

| When | File | Cmd+F Search String |
|------|------|-------------------|
| ACT 1 (0:20) | `cases/fema-2026-02-12/README.md` | `At a Glance` |
| ACT 1 (0:28) | `cases/fema-2026-02-12/README.md` | `Multi-Signal Entities` |
| ACT 2 (0:38) | `cases/fema-2026-02-12/investigation-narrative.md` | `Step 1: Forming Hypothesis` |
| ACT 2 (0:45) | `cases/fema-2026-02-12/investigation-narrative.md` | `strongly suggesting COVID-19` |
| ACT 2 (0:58) | `cases/fema-2026-02-12/investigation-narrative.md` | `DELIVERY ORDER FOR 60 MILLION` |
| ACT 2 (1:08) | `cases/fema-2026-02-12/investigation-narrative.md` | `most concentration findings` |
| ACT 3 (1:18) | `cases/fema-2026-02-12/dashboard.html` | *(scroll to Executive Summary cards — no search needed)* |
| ACT 3 (1:25) | `cases/fema-2026-02-12/dashboard.html` | `Who Got the Money?` |
| ACT 3 (1:28) | `cases/fema-2026-02-12/dashboard.html` | `When Did the Money Flow?` |
| ACT 3 (1:33) | `cases/fema-2026-02-12/dashboard.html` | `Non-Competitive Awards — PARKDALE` |
| ACT 3 (1:48) | `cases/dod-mit-2026-02-12/dashboard.html` | *(scroll to summary cards — 10,000 Awards)* |
| ACT 4 (1:58) | `F-R001-...-competition-data.csv` | `FILLAKIT` |
| ACT 4 (2:18) | `cases/fema-2026-02-12/dashboard.html` | *(scroll to green 36/36 card at top)* |
| ACT 5 (2:33) | VS Code | *(show src/ folder tree + npm test)* |

### Pacing Guide
| Act | Duration | Words | Focus |
|-----|----------|-------|-------|
| 1: Personal Hook | 35s | ~120 | Story: non-expert + open-source survey + Opus research |
| 2: AI Investigator | 40s | ~115 | Opus 4.6 reasoning trace in plain English -- the "wow" |
| 3: The Output | 40s | ~95 | Dashboard, charts, Five C's, DoD-MIT flash |
| 4: The Real Story | 35s | ~85 | Fillakit soda bottles, self-verification |
| 5: The Close | 25s | ~75 | Triple-layer Opus story, zero-cost fallback |
| **Total** | **~175s** | **~490** | **~5s buffer** |

### The Three-Layer Opus 4.6 Story (thread throughout)
| Layer | What | Where in Script |
|-------|------|----------------|
| **Research** | Multiple agents surveyed open-source tools (Cardinal-rs, OCDSKit, Kingfisher Collect), explored OECD/OCP/GAO methodology | ACT 1 (0:00-0:15) |
| **Build** | Iterated on TypeScript architecture with Opus -- fold/finalize pattern, Five C's framework | ACT 3 (1:35-1:45) |
| **Runtime** | Autonomous investigator -- loops through findings, follows leads, externalizes reasoning | ACT 2 (full) + ACT 5 |

### Judging Criteria Coverage
| Criteria | Weight | Where Addressed |
|----------|--------|-----------------|
| **Demo** (30%) | ACT 1 + ACT 3 | Working pipeline, dashboard, charts, real data |
| **Impact** (25%) | ACT 1 + ACT 4 | Personal story, Fillakit soda bottles, "$200K auditor -> one command" |
| **Opus 4.6 Use** (25%) | ACT 1 + ACT 2 + ACT 5 | Research agents + open-source survey + runtime investigator + "AI taught me the domain" |
| **Depth & Execution** (20%) | ACT 4 + ACT 5 | Self-verification, 128 tests, 3-day build, zero-cost fallback |
