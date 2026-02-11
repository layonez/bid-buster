/**
 * Report narrator: assembles the final case.md report.
 */
import type {
  Signal,
  Hypothesis,
  EvidenceArtifact,
  InvestigationParams,
  Provenance,
  ChartArtifact,
  InvestigationFindings,
  QueryContext,
  MaterialFinding,
} from "../shared/types.js";
import type { SignalEngineResult } from "../signaler/types.js";

export interface ReportData {
  params: InvestigationParams;
  signalResult: SignalEngineResult;
  hypotheses: Hypothesis[];
  evidence: EvidenceArtifact[];
  provenance: Provenance;
  charts?: ChartArtifact[];
  investigationFindings?: InvestigationFindings;
  queryContext?: QueryContext;
  materialFindings?: MaterialFinding[];
}

export function assembleReport(data: ReportData): string {
  const lines: string[] = [];
  const { params, signalResult, hypotheses, provenance } = data;

  // ─── Header ────────────────────────────────────────────────────────────
  const title = params.recipient
    ? `${params.agency ?? "All Agencies"} → ${params.recipient}`
    : params.agency ?? "Investigation";

  lines.push(`# Investigation Case File: ${title}`);
  lines.push(`## Period: ${params.periodStart} to ${params.periodEnd}`);
  lines.push("");
  lines.push("**[Open Interactive Dashboard](dashboard.html)** for charts, sortable tables, and visual evidence.");
  lines.push("");

  // ─── Disclaimer ────────────────────────────────────────────────────────
  lines.push("> **Disclaimer:** This report is a screening instrument. Red flags are");
  lines.push("> indicators that warrant further investigation by competent authorities.");
  lines.push("> They are **not proof of wrongdoing**. Unusual patterns may have legitimate");
  lines.push("> explanations. (OECD Guidelines for Fighting Bid Rigging, 2025; OCP Red");
  lines.push("> Flags Guide, 2024)");
  lines.push("");

  // ─── Executive Summary ─────────────────────────────────────────────────
  lines.push("## Executive Summary");
  lines.push("");

  const execHypothesis = hypotheses.find((h) => h.id === "H-EXECUTIVE");
  if (execHypothesis) {
    lines.push(execHypothesis.context);
    lines.push("");
  }

  lines.push(`**${signalResult.summary.totalSignals} signals detected** across ` +
    `${signalResult.summary.totalIndicatorsRun} indicators:`);
  lines.push(`- High severity: ${signalResult.summary.signalsBySeverity.high ?? 0}`);
  lines.push(`- Medium severity: ${signalResult.summary.signalsBySeverity.medium ?? 0}`);
  lines.push(`- Low severity: ${signalResult.summary.signalsBySeverity.low ?? 0}`);
  lines.push("");

  // ─── Material Findings (inverted pyramid: key findings first) ─────────
  if (data.materialFindings && data.materialFindings.length > 0) {
    lines.push("## Material Findings");
    lines.push("");
    lines.push(`${data.materialFindings.length} findings ranked by materiality (dollar exposure × severity × signal count):`);
    lines.push("");

    for (const finding of data.materialFindings) {
      const tag = finding.aiTag ? ` \`[${finding.aiTag}]\`` : "";
      const sev = finding.severity === "high" ? "**HIGH**" : finding.severity === "medium" ? "MEDIUM" : "LOW";
      lines.push(`### ${finding.id}: ${finding.indicatorName} — ${finding.entityName}${tag}`);
      lines.push(`**Severity:** ${sev} | **Exposure:** $${finding.totalDollarValue.toLocaleString()} | **Awards:** ${finding.affectedAwardIds.length}`);
      lines.push("");

      if (finding.fiveCs) {
        lines.push(`**Condition:** ${finding.fiveCs.condition}`);
        lines.push("");
        lines.push(`**Criteria:** ${finding.fiveCs.criteria}`);
        lines.push("");
        lines.push(`**Cause:** ${finding.fiveCs.cause}`);
        lines.push("");
        lines.push(`**Effect:** ${finding.fiveCs.effect}`);
        lines.push("");
        lines.push(`**Recommendation:** ${finding.fiveCs.recommendation}`);
      } else {
        lines.push(finding.signals[0]?.context ?? "");
      }
      lines.push("");
    }
  }

  // ─── Investigation Notes (prominent, not appendix) ─────────────────────
  if (data.investigationFindings?.reasoningSteps && data.investigationFindings.reasoningSteps.length > 0) {
    lines.push("## Investigation Notes");
    lines.push("");
    lines.push("*The Opus 4.6 investigative agent recorded the following reasoning during its analysis:*");
    lines.push("");
    for (const step of data.investigationFindings.reasoningSteps) {
      const phaseLabel =
        step.phase === "hypothesis" ? "Hypothesis" :
        step.phase === "data_gathering" ? "Data Gathering" :
        step.phase === "analysis" ? "Analysis" : "Synthesis";
      lines.push(`> **[${phaseLabel}]** ${step.reasoning}`);
      lines.push("");
    }
  }

  // ─── Data Overview ─────────────────────────────────────────────────────
  lines.push("## Data Overview");
  lines.push("");
  lines.push(`- **Source:** USAspending API (snapshot: ${provenance.timestamp.slice(0, 10)})`);
  if (params.agency) lines.push(`- **Agency:** ${params.agency}`);
  if (params.recipient) lines.push(`- **Recipient:** ${params.recipient}`);
  lines.push(`- **Period:** ${params.periodStart} to ${params.periodEnd}`);
  lines.push(`- **Award types:** ${params.awardTypeCodes.join(", ")}`);
  lines.push("");

  // ─── Data Scope & Interpretation ──────────────────────────────────────
  lines.push("## Data Scope & Interpretation");
  lines.push("");
  lines.push("- **Award amounts** shown are cumulative contract values from inception, not spending within the queried period alone.");
  lines.push(`- The **time_period** filter (${params.periodStart} to ${params.periodEnd}) selects awards with activity during this period; awards may have start dates outside this range.`);
  if (data.queryContext?.isRecipientFiltered) {
    lines.push(`- **Recipient filter active** (\`${data.queryContext.recipientFilter}\`): all metrics (concentration, peer groups, competition rates) reflect only this recipient's awards, not the full agency portfolio.`);
  }
  if (data.queryContext?.isAgencyFiltered) {
    lines.push(`- **Agency filter active** (\`${data.queryContext.agencyFilter}\`): metrics are scoped to this agency's awards only.`);
  }
  lines.push("");

  // ─── Signals (appendix-style: collapsible for large counts) ───────────
  lines.push("## Signals Detected");
  lines.push("");

  if (signalResult.signals.length > 50) {
    lines.push(`<details><summary>Show all ${signalResult.signals.length} signals</summary>`);
    lines.push("");
  }

  lines.push("| # | Indicator | Severity | Entity | Value | Context |");
  lines.push("|---|-----------|----------|--------|-------|---------|");

  signalResult.signals.forEach((signal, i) => {
    const sev =
      signal.severity === "high" ? "**HIGH**" :
      signal.severity === "medium" ? "MEDIUM" : "LOW";
    lines.push(
      `| ${i + 1} | ${signal.indicatorName} (${signal.indicatorId}) | ${sev} | ` +
      `${signal.entityName.slice(0, 30)} | ${signal.value} | ` +
      `${signal.context.slice(0, 80)}... |`,
    );
  });

  if (signalResult.signals.length > 50) {
    lines.push("</details>");
  }
  lines.push("");

  // ─── Hypotheses & Evidence ─────────────────────────────────────────────
  lines.push("## Hypotheses & Evidence");
  lines.push("");

  const nonExecHypotheses = hypotheses.filter((h) => h.id !== "H-EXECUTIVE");
  for (const hypothesis of nonExecHypotheses) {
    lines.push(`### ${hypothesis.id}: ${hypothesis.question}`);
    lines.push("");
    lines.push(`**Severity:** ${hypothesis.severity}`);
    lines.push(`**Triggered by:** ${hypothesis.signalIds.join(", ")}`);
    lines.push("");
    lines.push(hypothesis.context);
    lines.push("");

    // Embed chart images for this hypothesis
    const relatedCharts = (data.charts ?? []).filter(
      (c) => c.hypothesisIds.includes(hypothesis.id),
    );
    for (const chart of relatedCharts) {
      lines.push(`![${chart.title}](${chart.filePath})`);
      lines.push("");
    }

    // Link evidence artifacts for this hypothesis
    const relatedEvidence = data.evidence.filter(
      (e) => e.hypothesisId === hypothesis.id,
    );
    if (relatedEvidence.length > 0) {
      lines.push("**Supporting evidence:**");
      for (const artifact of relatedEvidence) {
        lines.push(`- [${artifact.title}](${artifact.filePath}) -- ${artifact.description}`);
      }
      lines.push("");
    }

    lines.push("**Evidence needed for further review:**");
    for (const need of hypothesis.evidenceNeeded) {
      lines.push(`- ${need}`);
    }
    lines.push("");
  }

  // ─── Investigator Findings (--deep mode) ────────────────────────────────
  if (data.investigationFindings && data.investigationFindings.summary) {
    lines.push("## Investigator Findings");
    lines.push("");
    lines.push(`*Opus 4.6 agent completed ${data.investigationFindings.iterations} iteration(s) with ${data.investigationFindings.toolCallLog.length} tool call(s).*`);
    lines.push("");
    lines.push(data.investigationFindings.summary);
    lines.push("");

    if (data.investigationFindings.crossReferences.length > 0) {
      lines.push("### Cross-References");
      lines.push("");
      lines.push("| Source A | Source B | Finding | Impact |");
      lines.push("|----------|---------|---------|--------|");
      for (const cr of data.investigationFindings.crossReferences) {
        lines.push(`| ${cr.sourceA} | ${cr.sourceB} | ${cr.finding.slice(0, 60)}... | ${cr.impact} |`);
      }
      lines.push("");
    }
  }

  // ─── Data Quality ──────────────────────────────────────────────────────
  lines.push("## Data Quality & Coverage");
  lines.push("");
  lines.push("| Indicator | Records with Required Fields | Coverage |");
  lines.push("|-----------|----------------------------|----------|");

  for (const meta of signalResult.metadata) {
    lines.push(
      `| ${meta.id} ${meta.name} | ${meta.dataCoverage.recordsWithRequiredFields}/${meta.dataCoverage.totalRecords} | ${meta.dataCoverage.coveragePercent.toFixed(0)}% |`,
    );
  }
  lines.push("");

  lines.push("**Notes:**");
  lines.push("- `number_of_offers_received` has poor fill rates in USAspending data, limiting R001 coverage.");
  lines.push("- R005 (Modifications) requires transaction data fetched with `--with-transactions` flag.");
  if (data.queryContext?.isRecipientFiltered) {
    lines.push("- R004 (Concentration) signals for the filtered recipient are suppressed as structurally inevitable.");
  } else {
    lines.push("- R004 (Concentration) signals are expected when filtering by a single recipient.");
  }
  lines.push("");

  // ─── Methodology ───────────────────────────────────────────────────────
  lines.push("## Methodology");
  lines.push("");
  lines.push("Indicators are based on the Open Contracting Partnership's [Red Flags in Public");
  lines.push("Procurement](https://www.open-contracting.org/resources/red-flags-in-public-procurement/) (2024)");
  lines.push("and the OECD's [Guidelines for Fighting Bid Rigging](https://www.oecd.org/en/publications/2025/09/) (2025).");
  lines.push("");
  lines.push("**Thresholds used:**");
  for (const meta of signalResult.metadata) {
    const thresholds = Object.entries(meta.thresholdsUsed)
      .map(([k, v]) => `${k}=${v}`)
      .join(", ");
    lines.push(`- ${meta.id}: ${thresholds}`);
  }
  lines.push("");

  // ─── Provenance ────────────────────────────────────────────────────────
  lines.push("## Provenance");
  lines.push("");
  lines.push(`- **Generated:** ${provenance.timestamp}`);
  lines.push(`- **Tool version:** ${provenance.toolVersion}`);
  if (provenance.gitCommit) lines.push(`- **Git commit:** ${provenance.gitCommit}`);
  lines.push(`- **Node.js:** ${provenance.nodeVersion}`);
  lines.push("");

  lines.push("---");
  lines.push("*Generated by Procurement Investigator (Investigation-as-Code)*");

  return lines.join("\n");
}
