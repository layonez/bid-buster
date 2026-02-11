/**
 * Report narrator: assembles the final case.md report.
 */
import type {
  Signal,
  Hypothesis,
  EvidenceArtifact,
  InvestigationParams,
  Provenance,
} from "../shared/types.js";
import type { SignalEngineResult } from "../signaler/types.js";

export interface ReportData {
  params: InvestigationParams;
  signalResult: SignalEngineResult;
  hypotheses: Hypothesis[];
  evidence: EvidenceArtifact[];
  provenance: Provenance;
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

  // ─── Data Overview ─────────────────────────────────────────────────────
  lines.push("## Data Overview");
  lines.push("");
  lines.push(`- **Source:** USAspending API (snapshot: ${provenance.timestamp.slice(0, 10)})`);
  if (params.agency) lines.push(`- **Agency:** ${params.agency}`);
  if (params.recipient) lines.push(`- **Recipient:** ${params.recipient}`);
  lines.push(`- **Period:** ${params.periodStart} to ${params.periodEnd}`);
  lines.push(`- **Award types:** ${params.awardTypeCodes.join(", ")}`);
  lines.push("");

  // ─── Signals ───────────────────────────────────────────────────────────
  lines.push("## Signals Detected");
  lines.push("");
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
  lines.push("- R004 (Concentration) signals are expected when filtering by a single recipient.");
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
