# README & PROJECT_BRIEF Polish Recommendations

Targeted improvements for hackathon judges. Each recommendation includes the exact current text, suggested replacement, rationale, and priority.

---

## Judging Criteria Reminder (from Hackathon rules.md)

1. **Impact (25%)** -- Real-world potential, who benefits, does it fit the problem statement?
2. **Opus 4.6 Use (25%)** -- Creative use beyond basic integration. Surprises?
3. **Depth & Execution (20%)** -- Pushed past first idea? Sound engineering, real craft?
4. **Demo (30%)** -- Working, impressive, genuinely cool to watch?

---

## README.md Recommendations

### 1. CRITICAL: First line -- add a human hook before the subtitle

**Old text (line 3):**
```
**Investigation-as-Code: AI-powered procurement integrity screening for everyone**
```

**New text:**
```
**One person. One command. $700 billion in public spending, audited.**

> *Built by a non-expert who had never touched procurement data. Claude Opus 4.6 brings the methodology of $200K/year forensic auditors to anyone with a terminal.*
```

**Rationale:** The current subtitle is descriptive but abstract. Judges scan the first 5 seconds -- the "one person did this" angle and the dollar contrast ($200K auditor vs one command) are the strongest hooks this project has. The personal journey of a non-expert empowered by AI directly maps to Problem Statement #2 ("Break the Barriers") and also highlights Opus 4.6 creative usage. Currently the "Before/After" ($200K auditor vs one command) is buried at line 109-110. It needs to be above the fold.

---

### 2. CRITICAL: Move the Fillakit story higher and make it more visceral

**Old text (lines 31-33):**
```
> *Fillakit LLC -- a company formed 6 days before receiving a $10.16M FEMA contract for COVID test tubes -- later shipped unusable mini soda bottles. Our system flags Fillakit's single-bid urgency pattern automatically. The Senate and DHS Inspector General subsequently investigated.*
>
> [ProPublica: "The Trump Administration Paid Millions for Test Tubes -- and Got Unusable Mini Soda Bottles"](https://www.propublica.org/article/the-trump-administration-paid-millions-for-test-tubes-and-got-unusable-mini-soda-bottles)
```

**New text:**
```
> **The soda bottle test.**  Fillakit LLC was formed 6 days before receiving a $10.16M FEMA contract for COVID test tubes. They shipped miniature soda bottles. Our system flags this automatically -- single-bid urgency pattern, no prior contract history, anomalous pricing. The Senate and DHS Inspector General later investigated the same company.
>
> [ProPublica: "The Trump Administration Paid Millions for Test Tubes -- and Got Unusable Mini Soda Bottles"](https://www.propublica.org/article/the-trump-administration-paid-millions-for-test-tubes-and-got-unusable-mini-soda-bottles)
```

**Rationale:** The Fillakit story is the single most compelling proof point. A bold lead-in ("The soda bottle test.") makes it scannable. Adding "no prior contract history, anomalous pricing" shows the system catches multiple signals, not just one. Removing "unusable mini soda bottles" from the leading phrase and replacing with the punchier "miniature soda bottles" tightens the prose. Consider moving this entire block up to right after the vendor table (before the stats line on line 29) -- the visceral story should come before the dry metrics.

---

### 3. HIGH: Make Opus 4.6 creative usage visible within first 30 seconds

**Old text (lines 37-49, "What Makes This Novel" section):**
The section leads with "Investigation-as-Code" which is an architecture concept, not an Opus 4.6 showcase.

**Suggested restructure:** Reorder the 6 points to lead with the AI-specific differentiators, since Opus 4.6 Use is 25% of the judging score:

```
## What Makes This Novel

1. **Opus 4.6 as Autonomous Investigator** -- Not a chatbot wrapper. The agent runs an independent investigation loop: 8 iterations, 35 tool calls, entity verification via SAM.gov, sanctions screening, comparative analysis -- and externalizes every thought via `log_reasoning` so you can read its reasoning like a detective's notebook.

2. **Self-Verifying AI** -- Every claim the agent makes must survive a verification pass against computed statistical evidence. The Verifier agent rejects unsupported assertions. This is the quality gate most AI tools lack.

3. **Investigation-as-Code** -- The entire audit methodology is codified, version-controlled, and reproducible. Every run produces a git-committable case folder with full provenance. Not locked in a PDF manual or institutional knowledge.

4. **Multi-signal convergence** -- When multiple independent statistical tests flag the same entity, that's a meaningful signal, not noise. Parkdale was flagged by both R004 (concentration) AND R006 (price outlier) independently.

5. **Three-tier AI architecture** -- Opus 4.6 for deep investigation ($4/case), Sonnet 4.5 for cost-efficient narrative enrichment ($0.10/case), template fallback for $0. Graceful degradation ensures accessibility at any budget.

6. **Open methodology** -- 6 indicators from recognized frameworks (OCP, OECD, GAO) with configurable thresholds. Not a black-box risk score.
```

**Rationale:** The judging rubric weights "Opus 4.6 Use" at 25%. Currently it takes scrolling to the "Three-Tier AI Strategy" section (line 158+) to understand how Opus is used. Leading with the autonomous agent loop and the self-verification angle immediately signals creative, non-trivial usage of Opus 4.6.

---

### 4. HIGH: Quick Start -- reduce to absolute minimum for a judge to try it

**Old text (lines 63-79):**
```bash
git clone https://github.com/AnsKaz-github/bid-buster.git
cd bid-buster
npm install

# Run an investigation (no AI required, $0 cost)
npm run investigate -- run \
  --subtier-agency="Federal Emergency Management Agency" \
  --period=2020-01-01:2020-12-31 \
  --charts --no-ai
```

**New text:**
```bash
git clone https://github.com/AnsKaz-github/bid-buster.git && cd bid-buster && npm install

# Try it now -- no API key needed, $0 cost, ~2 minutes
npm run investigate -- run \
  --subtier-agency="Federal Emergency Management Agency" \
  --period=2020-01-01:2020-12-31 \
  --charts --no-ai

# Output: cases/fema-{date}/ -- open dashboard.html in your browser
```

**Rationale:** Judges have limited time. Combining the clone/install into one line and adding the "~2 minutes" time estimate and the "open dashboard.html" payoff instruction makes this feel achievable. The output hint tells them what to look for.

---

### 5. HIGH: Add a "Built by a non-expert" callout somewhere prominent

**Current state:** There is no mention of the builder's background. The "personal journey" angle is completely absent from the README.

**Suggested addition** (after the Quick Start section, before "The Problem We Solve"):

```
---

## The Personal Journey

I am not a procurement auditor. I have never worked in government contracting. Before this project, I didn't know what FAR 6.302 was or why single-bid rates matter.

Claude Opus 4.6 made this possible -- not just as a coding assistant, but as a domain expert. The AI taught me procurement audit methodology (OECD, OCP, GAO frameworks), helped me understand USAspending data schemas, and then became the investigative agent embedded in the tool itself.

**That's the point.** If a non-expert can build a professional-grade integrity screening tool in a hackathon, imagine what journalists, watchdogs, and oversight offices can do with it.
```

**Rationale:** This directly addresses Problem Statement #2 ("Break the Barriers") at a meta level -- the tool breaks barriers for users AND the builder broke barriers to create it. This is extremely compelling for judges evaluating "Impact" and "Opus 4.6 Use." Adjust the specifics to match the actual builder's background.

---

### 6. MEDIUM: Add a one-line "What judges see in 30 seconds" summary at the very top

**Suggested addition** right after the H1 title, before the subtitle:

```
> **Hackathon 2025 | Problem Statement #2: Break the Barriers** | [Demo Video](#) | [Sample Output](cases/fema-2026-02-12/README.md)
```

**Rationale:** Judges reviewing repos asynchronously need instant orientation. The problem statement alignment, a link to the demo video, and a link to the sample output give them three entry points. Update the demo video link once it exists.

---

### 7. MEDIUM: Tighten the "At a Glance" stats for maximum punch

**Old text (line 29):**
```
**1,465 raw signals -> 16 material findings** (92x reduction). **2 convergence entities** flagged by multiple independent indicators. **36/36 claims verified** against computed evidence. **5.0 MB** git-committable case folder.
```

**New text:**
```
**1,465 signals -> 16 material findings** (92x noise reduction) | **2 convergence entities** (multi-indicator) | **36/36 claims verified** (100%) | **5.0 MB** git-committable case folder
```

**Rationale:** Pipe-separated stats scan faster than full sentences. Adding "100%" next to verification makes the perfect score more visible. "noise reduction" is more evocative than just "reduction."

---

### 8. MEDIUM: Badge row -- add visual badges for instant credibility

**Old text (line 7):**
```
`128 tests passing` | `TypeScript strict` | `MIT License` | `Node 20+` | `47 files, ~9,865 lines`
```

**New text:**
```
![Tests](https://img.shields.io/badge/tests-128%20passing-brightgreen) ![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue) ![License](https://img.shields.io/badge/license-MIT-green) ![Node](https://img.shields.io/badge/node-20%2B-339933) ![Lines](https://img.shields.io/badge/lines-~9%2C865-informational)
```

**Rationale:** Static shields.io badges are visually more professional on GitHub than backtick-wrapped text. They render as colored pills and immediately signal project maturity. These are static badges (no CI required) -- they just render the text you encode in the URL.

---

### 9. MEDIUM: The mermaid diagrams are great -- add alt text comments for accessibility

**Current state:** The 5 mermaid diagrams render beautifully on GitHub but have no text fallback.

**Suggested:** Keep all mermaid diagrams as-is. They are visually impressive and differentiate this project. No changes needed -- this is a "preserve" recommendation.

---

### 10. MEDIUM: "Hackathon Compliance" table feels defensive -- reframe it

**Old text (lines 368-377):**
```
## Hackathon Compliance

| Requirement | Status |
|-------------|--------|
| Open source (all components) | MIT License |
| New work only | Git history shows clean start (30+ commits) |
...
```

**New text:**
```
## Hackathon Alignment

| | |
|---|---|
| **Problem Statement** | #2 "Break the Barriers" -- expert procurement audit in everyone's hands |
| **Open Source** | MIT License, all components |
| **New Work** | Built from scratch during hackathon (see git history) |
| **Team** | 1-2 members |
| **Claude Models** | Opus 4.6 (investigation agent) + Sonnet 4.5 (narrative) + $0 fallback |
```

**Rationale:** "Compliance" sounds like a checkbox exercise. "Alignment" sounds like intentional fit. Adding the Claude models row here reinforces the AI usage for judges skimming to the bottom.

---

## PROJECT_BRIEF.md Recommendations

### 11. HIGH: Lead with the real-world validation, not the problem statement

**Current structure:** Problem Statement -> What It Does -> Real-World Validation -> How It Uses Claude

**Suggested structure:** Real-World Validation (hook) -> Problem Statement (context) -> How It Uses Claude -> What It Does (details)

**Rationale:** PROJECT_BRIEF.md may be read as the "written summary" for judging. Leading with "We pointed this at FEMA's COVID procurement and it independently flagged companies later investigated by Congress" is far more compelling than starting with an abstract problem description. The problem statement paragraph can follow as "why this matters."

---

### 12. HIGH: Add a "Key Model Capabilities" callout box in PROJECT_BRIEF.md

**Current text (lines 101-107):**
```
**Key model capabilities demonstrated:**
- **Autonomous tool-calling agent** -- Opus 4.6 with 8 domain-specific tools, cost budgeting, iteration limits
- **Multi-model architecture** -- Opus for complex reasoning, Sonnet for cost-efficient enrichment, templates as fallback
...
```

**New text:**
```
### Why This Showcases Opus 4.6

| Capability | How We Use It |
|------------|--------------|
| **Autonomous tool-calling** | 8 domain-specific tools, 10-iteration loop, cost budgeting |
| **Extended reasoning** | `log_reasoning` externalizes the agent's investigation process into a readable narrative |
| **Multi-model orchestration** | Opus for investigation, Sonnet for narratives, templates as $0 fallback |
| **Ethical reasoning** | Non-accusatory framing enforced in system prompts and structurally verified |
| **Self-verification** | Verifier agent rejects claims not backed by computed evidence |
| **Graceful degradation** | Three cost tiers ($4 / $0.10 / $0) ensure accessibility |
```

**Rationale:** A table is more scannable than a bullet list. Renaming to "Why This Showcases Opus 4.6" directly addresses the 25% judging criterion by name.

---

### 13. MEDIUM: The 100-200 word summary requirement

The hackathon rules mention a "Written summary (100-200 words)" as part of the submission. Consider preparing a standalone 200-word version. Here is a draft:

```
Procurement Investigator turns public spending data into auditable integrity reports -- putting
$200K/year forensic audit expertise in everyone's hands.

One command analyzes thousands of government contracts using six red-flag indicators drawn from
OECD, OCP, and GAO audit frameworks. An autonomous Claude Opus 4.6 agent then investigates the
top findings: verifying entities via SAM.gov, screening sanctions databases, comparing prices
against peer groups, and externalizing every thought into a transparent reasoning trace.

We validated against FEMA's 2020 COVID procurement (7,259 contracts, zero prior knowledge). The
system independently flagged Parkdale Mills ($532M sole-source), Hanesbrands ($175M
non-competitive), and Fillakit LLC -- the company that shipped soda bottles instead of test
tubes, later investigated by the Senate and DHS Inspector General.

Every finding is verified: 36/36 claims pass evidence cross-check. Every run is reproducible:
git-committable case folders with full provenance. And every tier is accessible: $4/case with
Opus 4.6, $0.10 with Sonnet, or $0 with template-only mode.

Built for Problem Statement #2: Break the Barriers. Expert knowledge in everyone's hands.
```

**Rationale:** Having this pre-written ensures the submission text is as polished as the code.

---

## Summary of Priorities

| # | Priority | File | Change |
|---|----------|------|--------|
| 1 | CRITICAL | README.md | Human hook in first line -- personal journey + $200K contrast |
| 2 | CRITICAL | README.md | Fillakit story -- bolder lead-in, move higher |
| 3 | HIGH | README.md | Reorder "What Makes This Novel" to lead with Opus 4.6 |
| 4 | HIGH | README.md | Streamline Quick Start for 2-minute judge tryout |
| 5 | HIGH | README.md | Add "Built by a non-expert" personal journey section |
| 6 | MEDIUM | README.md | Add judge orientation line with links at top |
| 7 | MEDIUM | README.md | Tighten stats line with pipe separators |
| 8 | MEDIUM | README.md | Replace backtick badges with shields.io images |
| 9 | MEDIUM | README.md | Keep mermaid diagrams (preserve, no changes) |
| 10 | MEDIUM | README.md | Reframe "Compliance" as "Alignment" |
| 11 | HIGH | PROJECT_BRIEF.md | Lead with real-world validation, not problem statement |
| 12 | HIGH | PROJECT_BRIEF.md | Table format for "Why This Showcases Opus 4.6" |
| 13 | MEDIUM | (submission) | Pre-written 200-word summary for judging platform |

---

*Generated by README polish review agent. All recommendations are targeted edits, not rewrites.*
