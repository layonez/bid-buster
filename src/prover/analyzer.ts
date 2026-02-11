/**
 * Evidence analyzer (Prover Agent).
 * Produces CSV evidence tables and summary data per hypothesis.
 * Each hypothesis gets supporting data extracts written to the evidence/ directory.
 */
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { Signal, Hypothesis, EvidenceArtifact, MaterialFinding } from "../shared/types.js";
import type { NormalizedAward, Transaction } from "../normalizer/schema.js";
import type { SignalEngineResult } from "../signaler/types.js";

export interface ProverInput {
  hypotheses: Hypothesis[];
  signalResult: SignalEngineResult;
  awards: NormalizedAward[];
  transactions: Map<string, Transaction[]>;
  evidenceDir: string;
  findings?: MaterialFinding[];
  fullEvidence?: boolean;
  summaryEvidenceDir?: string;
  detailEvidenceDir?: string;
}

/**
 * Produce evidence artifacts (CSV tables + summary JSON) for each hypothesis.
 * When findings + summaryEvidenceDir are provided, produces entity-scoped evidence
 * filtered to each finding's affectedAwardIds. Otherwise falls back to legacy
 * per-hypothesis mode for backward compatibility.
 */
export async function produceEvidence(input: ProverInput): Promise<EvidenceArtifact[]> {
  if (input.findings && input.findings.length > 0 && input.summaryEvidenceDir) {
    return produceScopedEvidence(input);
  }
  return produceLegacyEvidence(input);
}

/**
 * Legacy mode: produce evidence per hypothesis with full (unfiltered) award data.
 * Used when no findings are provided (backward compat for existing callers/tests).
 */
async function produceLegacyEvidence(input: ProverInput): Promise<EvidenceArtifact[]> {
  const artifacts: EvidenceArtifact[] = [];

  for (const hypothesis of input.hypotheses) {
    if (hypothesis.id === "H-EXECUTIVE") continue;

    const relatedSignals = input.signalResult.signals.filter((s) =>
      hypothesis.signalIds.includes(s.indicatorId),
    );

    if (relatedSignals.length === 0) continue;

    const primaryIndicator = relatedSignals[0].indicatorId;

    const produced = await produceEvidenceForIndicator(
      primaryIndicator,
      hypothesis,
      relatedSignals,
      input.awards,
      input.transactions,
      input.evidenceDir,
    );

    artifacts.push(...produced);
  }

  // Always produce a master awards summary CSV
  const summaryArtifact = await produceAwardsSummary(input.awards, input.evidenceDir);
  artifacts.push(summaryArtifact);

  return artifacts;
}

/**
 * Entity-scoped mode: produce evidence per MaterialFinding, filtered to each
 * finding's affectedAwardIds. Summary CSVs go to evidence/summary/.
 * Full detail CSVs + master summary go to evidence/detail/ only when fullEvidence is set.
 */
async function produceScopedEvidence(input: ProverInput): Promise<EvidenceArtifact[]> {
  const artifacts: EvidenceArtifact[] = [];
  const summaryDir = input.summaryEvidenceDir!;

  // Build index for O(1) award lookup
  const awardIndex = new Map<string, NormalizedAward>();
  for (const a of input.awards) {
    awardIndex.set(a.awardId, a);
  }

  for (const finding of input.findings!) {
    const scopedAwards = finding.affectedAwardIds
      .map((id) => awardIndex.get(id))
      .filter((a): a is NormalizedAward => a != null);

    if (scopedAwards.length === 0) continue;

    // Create a virtual hypothesis so we can reuse existing evidence functions
    const virtualHypothesis: Hypothesis = {
      id: finding.id,
      signalIds: [finding.indicatorId],
      question: "",
      context: "",
      evidenceNeeded: [],
      severity: finding.severity,
    };

    // R004 needs full dataset for market share context; R006 needs full NAICS peer group
    const awardsForEvidence = (finding.indicatorId === "R004" || finding.indicatorId === "R006") ? input.awards : scopedAwards;

    const produced = await produceEvidenceForIndicator(
      finding.indicatorId,
      virtualHypothesis,
      finding.signals,
      awardsForEvidence,
      input.transactions,
      summaryDir,
    );

    // Fix filePaths to reflect summary subdirectory
    for (const artifact of produced) {
      artifact.filePath = artifact.filePath.replace(/^evidence\//, "evidence/summary/");
    }

    artifacts.push(...produced);
  }

  // Full evidence mode: also produce unfiltered per-hypothesis detail + master summary
  if (input.fullEvidence && input.detailEvidenceDir) {
    const detailDir = input.detailEvidenceDir;

    for (const hypothesis of input.hypotheses) {
      if (hypothesis.id === "H-EXECUTIVE") continue;

      const relatedSignals = input.signalResult.signals.filter((s) =>
        hypothesis.signalIds.includes(s.indicatorId),
      );

      if (relatedSignals.length === 0) continue;

      const primaryIndicator = relatedSignals[0].indicatorId;
      const produced = await produceEvidenceForIndicator(
        primaryIndicator,
        hypothesis,
        relatedSignals,
        input.awards,
        input.transactions,
        detailDir,
      );

      for (const artifact of produced) {
        artifact.filePath = artifact.filePath.replace(/^evidence\//, "evidence/detail/");
      }

      artifacts.push(...produced);
    }

    // Master awards summary in detail dir
    const summaryArtifact = await produceAwardsSummary(input.awards, detailDir);
    summaryArtifact.filePath = summaryArtifact.filePath.replace(/^evidence\//, "evidence/detail/");
    artifacts.push(summaryArtifact);
  }

  return artifacts;
}

/**
 * Produce indicator-specific evidence tables.
 */
async function produceEvidenceForIndicator(
  indicatorId: string,
  hypothesis: Hypothesis,
  signals: Signal[],
  awards: NormalizedAward[],
  transactions: Map<string, Transaction[]>,
  evidenceDir: string,
): Promise<EvidenceArtifact[]> {
  switch (indicatorId) {
    case "R001":
      return produceR001Evidence(hypothesis, signals, awards, evidenceDir);
    case "R002":
      return produceR002Evidence(hypothesis, signals, awards, evidenceDir);
    case "R003":
      return produceR003Evidence(hypothesis, signals, awards, evidenceDir);
    case "R004":
      return produceR004Evidence(hypothesis, signals, awards, evidenceDir);
    case "R005":
      return produceR005Evidence(hypothesis, signals, awards, transactions, evidenceDir);
    case "R006":
      return produceR006Evidence(hypothesis, signals, awards, evidenceDir);
    default:
      return [];
  }
}

// ─── R001: Single-Bid Competition ───────────────────────────────────────────

async function produceR001Evidence(
  hypothesis: Hypothesis,
  signals: Signal[],
  awards: NormalizedAward[],
  evidenceDir: string,
): Promise<EvidenceArtifact[]> {
  const artifacts: EvidenceArtifact[] = [];

  // CSV: Awards with competition data
  const competedAwards = awards.filter((a) => a.extentCompeted != null);
  const headers = ["Award ID", "Recipient", "Amount", "Extent Competed", "Offers Received", "Set Aside Type"];
  const rows = competedAwards.map((a) => [
    a.awardId,
    csvEscape(a.recipientName),
    a.awardAmount.toString(),
    a.extentCompeted ?? "",
    a.numberOfOffersReceived?.toString() ?? "N/A",
    a.typeSetAside ?? "",
  ]);

  const filename = `${hypothesis.id}-competition-data.csv`;
  await writeCsv(join(evidenceDir, filename), headers, rows);

  artifacts.push({
    id: `E-${hypothesis.id}-competition`,
    hypothesisId: hypothesis.id,
    type: "csv",
    title: "Competition Data for Flagged Awards",
    description: `${competedAwards.length} awards with competition fields. Supports analysis of single-bid patterns.`,
    filePath: `evidence/${filename}`,
    metadata: {
      totalAwards: competedAwards.length,
      withOfferData: competedAwards.filter((a) => a.numberOfOffersReceived != null).length,
      singleBidCount: competedAwards.filter((a) => a.numberOfOffersReceived === 1).length,
      signalCount: signals.length,
    },
  });

  // Summary: Offers distribution
  const offerDist = buildOfferDistribution(awards);
  const distFilename = `${hypothesis.id}-offer-distribution.csv`;
  await writeCsv(
    join(evidenceDir, distFilename),
    ["Offers Received", "Count", "Percentage"],
    offerDist,
  );

  artifacts.push({
    id: `E-${hypothesis.id}-offer-dist`,
    hypothesisId: hypothesis.id,
    type: "csv",
    title: "Distribution of Offers Received",
    description: "Breakdown of how many offers were received per competed award.",
    filePath: `evidence/${distFilename}`,
    metadata: { distribution: Object.fromEntries(offerDist.map((r) => [r[0], parseInt(r[1])])) },
  });

  return artifacts;
}

// ─── R002: Non-Competitive Awards ───────────────────────────────────────────

async function produceR002Evidence(
  hypothesis: Hypothesis,
  signals: Signal[],
  awards: NormalizedAward[],
  evidenceDir: string,
): Promise<EvidenceArtifact[]> {
  const artifacts: EvidenceArtifact[] = [];

  // CSV: Competition breakdown
  const competitionBreakdown = new Map<string, { count: number; totalAmount: number }>();
  for (const award of awards) {
    const code = award.extentCompeted ?? "UNKNOWN";
    const existing = competitionBreakdown.get(code) ?? { count: 0, totalAmount: 0 };
    existing.count++;
    existing.totalAmount += award.awardAmount;
    competitionBreakdown.set(code, existing);
  }

  const headers = ["Competition Code", "Description", "Award Count", "Total Amount", "Pct of Awards"];
  const rows = Array.from(competitionBreakdown.entries())
    .sort((a, b) => b[1].totalAmount - a[1].totalAmount)
    .map(([code, stats]) => [
      code,
      describeCompetitionCode(code),
      stats.count.toString(),
      stats.totalAmount.toFixed(2),
      ((stats.count / awards.length) * 100).toFixed(1),
    ]);

  const filename = `${hypothesis.id}-competition-breakdown.csv`;
  await writeCsv(join(evidenceDir, filename), headers, rows);

  artifacts.push({
    id: `E-${hypothesis.id}-breakdown`,
    hypothesisId: hypothesis.id,
    type: "csv",
    title: "Competition Type Breakdown",
    description: `Breakdown of ${awards.length} awards by competition type code with dollar amounts.`,
    filePath: `evidence/${filename}`,
    metadata: {
      totalAwards: awards.length,
      competitionTypes: competitionBreakdown.size,
      signalCount: signals.length,
    },
  });

  // CSV: Non-competed awards detail
  const nonCompeted = awards.filter((a) =>
    ["B", "C", "G", "NDO"].includes(a.extentCompeted ?? ""),
  );

  const detailHeaders = ["Award ID", "Recipient", "Amount", "Competition Code", "Description", "Start Date"];
  const detailRows = nonCompeted
    .sort((a, b) => b.awardAmount - a.awardAmount)
    .map((a) => [
      a.awardId,
      csvEscape(a.recipientName),
      a.awardAmount.toFixed(2),
      a.extentCompeted ?? "",
      csvEscape(a.description ?? ""),
      a.startDate,
    ]);

  const detailFilename = `${hypothesis.id}-non-competed-awards.csv`;
  await writeCsv(join(evidenceDir, detailFilename), detailHeaders, detailRows);

  artifacts.push({
    id: `E-${hypothesis.id}-detail`,
    hypothesisId: hypothesis.id,
    type: "csv",
    title: "Non-Competed Awards Detail",
    description: `${nonCompeted.length} non-competed awards sorted by amount.`,
    filePath: `evidence/${detailFilename}`,
    metadata: { nonCompetedCount: nonCompeted.length, totalNonCompetedAmount: nonCompeted.reduce((s, a) => s + a.awardAmount, 0) },
  });

  return artifacts;
}

// ─── R003: Contract Splitting ───────────────────────────────────────────────

async function produceR003Evidence(
  hypothesis: Hypothesis,
  signals: Signal[],
  awards: NormalizedAward[],
  evidenceDir: string,
): Promise<EvidenceArtifact[]> {
  const artifacts: EvidenceArtifact[] = [];

  // CSV: Awards near regulatory thresholds
  const thresholds = [250_000, 7_500_000];
  const bandPct = 0.10;

  const nearThreshold = awards.filter((a) =>
    thresholds.some((t) => {
      const lower = t * (1 - bandPct);
      return a.awardAmount >= lower && a.awardAmount <= t;
    }),
  );

  const headers = [
    "Award ID", "Recipient", "Amount", "Nearest Threshold",
    "Distance to Threshold", "Pct Below Threshold", "Start Date",
  ];
  const rows = nearThreshold
    .sort((a, b) => b.awardAmount - a.awardAmount)
    .map((a) => {
      const nearest = thresholds.reduce((best, t) =>
        Math.abs(a.awardAmount - t) < Math.abs(a.awardAmount - best) ? t : best,
      );
      return [
        a.awardId,
        csvEscape(a.recipientName),
        a.awardAmount.toFixed(2),
        nearest.toLocaleString(),
        (nearest - a.awardAmount).toFixed(2),
        (((nearest - a.awardAmount) / nearest) * 100).toFixed(2),
        a.startDate,
      ];
    });

  const filename = `${hypothesis.id}-near-threshold-awards.csv`;
  await writeCsv(join(evidenceDir, filename), headers, rows);

  artifacts.push({
    id: `E-${hypothesis.id}-threshold`,
    hypothesisId: hypothesis.id,
    type: "csv",
    title: "Awards Near Regulatory Thresholds",
    description: `${nearThreshold.length} awards within ${(bandPct * 100).toFixed(0)}% below a regulatory threshold.`,
    filePath: `evidence/${filename}`,
    metadata: { nearThresholdCount: nearThreshold.length, thresholds, signalCount: signals.length },
  });

  return artifacts;
}

// ─── R004: Vendor Concentration ─────────────────────────────────────────────

async function produceR004Evidence(
  hypothesis: Hypothesis,
  signals: Signal[],
  awards: NormalizedAward[],
  evidenceDir: string,
): Promise<EvidenceArtifact[]> {
  const artifacts: EvidenceArtifact[] = [];

  // CSV: Vendor share breakdown
  const vendorTotals = new Map<string, { count: number; totalAmount: number }>();
  let grandTotal = 0;

  for (const award of awards) {
    const name = award.recipientName;
    const existing = vendorTotals.get(name) ?? { count: 0, totalAmount: 0 };
    existing.count++;
    existing.totalAmount += award.awardAmount;
    vendorTotals.set(name, existing);
    grandTotal += award.awardAmount;
  }

  const headers = ["Vendor", "Award Count", "Total Amount", "Market Share Pct"];
  const rows = Array.from(vendorTotals.entries())
    .sort((a, b) => b[1].totalAmount - a[1].totalAmount)
    .map(([name, stats]) => [
      csvEscape(name),
      stats.count.toString(),
      stats.totalAmount.toFixed(2),
      grandTotal > 0 ? ((stats.totalAmount / grandTotal) * 100).toFixed(2) : "0",
    ]);

  const filename = `${hypothesis.id}-vendor-concentration.csv`;
  await writeCsv(join(evidenceDir, filename), headers, rows);

  artifacts.push({
    id: `E-${hypothesis.id}-concentration`,
    hypothesisId: hypothesis.id,
    type: "csv",
    title: "Vendor Concentration Analysis",
    description: `Spending distribution across ${vendorTotals.size} vendors (total: $${grandTotal.toLocaleString()}).`,
    filePath: `evidence/${filename}`,
    metadata: {
      vendorCount: vendorTotals.size,
      grandTotal,
      topVendorShare: rows.length > 0 ? parseFloat(rows[0][3]) : 0,
      signalCount: signals.length,
    },
  });

  return artifacts;
}

// ─── R005: Excessive Modifications ──────────────────────────────────────────

async function produceR005Evidence(
  hypothesis: Hypothesis,
  signals: Signal[],
  awards: NormalizedAward[],
  transactions: Map<string, Transaction[]>,
  evidenceDir: string,
): Promise<EvidenceArtifact[]> {
  const artifacts: EvidenceArtifact[] = [];

  // CSV: Awards with modification data
  const modifiedAwards = awards.filter((a) => (a.modificationCount ?? 0) > 0);

  const headers = ["Award ID", "Recipient", "Original Amount", "Current Amount", "Growth Ratio", "Modification Count", "Total Mod Amount"];
  const rows = modifiedAwards
    .sort((a, b) => (b.modificationCount ?? 0) - (a.modificationCount ?? 0))
    .map((a) => {
      const growth = a.awardAmount > 0 && a.totalObligation
        ? (a.totalObligation / a.awardAmount).toFixed(2)
        : "N/A";
      return [
        a.awardId,
        csvEscape(a.recipientName),
        a.awardAmount.toFixed(2),
        (a.totalObligation ?? a.awardAmount).toFixed(2),
        growth,
        (a.modificationCount ?? 0).toString(),
        (a.totalModificationAmount ?? 0).toFixed(2),
      ];
    });

  const filename = `${hypothesis.id}-modifications.csv`;
  await writeCsv(join(evidenceDir, filename), headers, rows);

  artifacts.push({
    id: `E-${hypothesis.id}-mods`,
    hypothesisId: hypothesis.id,
    type: "csv",
    title: "Contract Modifications Summary",
    description: `${modifiedAwards.length} awards with modification data.`,
    filePath: `evidence/${filename}`,
    metadata: { modifiedAwardCount: modifiedAwards.length, signalCount: signals.length },
  });

  // If we have transaction data, produce a detailed timeline
  if (transactions.size > 0) {
    const affectedIds = new Set(signals.flatMap((s) => s.affectedAwards));
    const txnHeaders = ["Award ID", "Mod Number", "Action Date", "Obligation Amount", "Action Type", "Description"];
    const txnRows: string[][] = [];

    for (const [awardId, txns] of transactions) {
      if (!affectedIds.has(awardId)) continue;
      for (const txn of txns) {
        txnRows.push([
          awardId,
          txn.modificationNumber,
          txn.actionDate,
          txn.federalActionObligation.toFixed(2),
          txn.actionTypeDescription ?? txn.actionType ?? "",
          csvEscape(txn.description ?? ""),
        ]);
      }
    }

    if (txnRows.length > 0) {
      const txnFilename = `${hypothesis.id}-modification-timeline.csv`;
      await writeCsv(join(evidenceDir, txnFilename), txnHeaders, txnRows);

      artifacts.push({
        id: `E-${hypothesis.id}-timeline`,
        hypothesisId: hypothesis.id,
        type: "csv",
        title: "Modification Timeline for Flagged Contracts",
        description: `Detailed modification history for ${affectedIds.size} flagged contracts.`,
        filePath: `evidence/${txnFilename}`,
        metadata: { transactionCount: txnRows.length, affectedContracts: affectedIds.size },
      });
    }
  }

  return artifacts;
}

// ─── R006: Price Outliers ───────────────────────────────────────────────────

async function produceR006Evidence(
  hypothesis: Hypothesis,
  signals: Signal[],
  awards: NormalizedAward[],
  evidenceDir: string,
): Promise<EvidenceArtifact[]> {
  const artifacts: EvidenceArtifact[] = [];

  // CSV: Awards by NAICS category with statistical context
  const byNaics = new Map<string, NormalizedAward[]>();
  for (const award of awards) {
    const key = award.naicsCode ?? "UNKNOWN";
    const group = byNaics.get(key) ?? [];
    group.push(award);
    byNaics.set(key, group);
  }

  const headers = [
    "Award ID", "Recipient", "Amount", "NAICS Code", "NAICS Description",
    "Category Mean", "Category Median", "Category Std Dev", "Z-Score",
  ];
  const rows: string[][] = [];

  for (const [naics, group] of byNaics) {
    if (group.length < 2) continue;

    const amounts = group.map((a) => a.awardAmount);
    const mean = amounts.reduce((s, v) => s + v, 0) / amounts.length;
    const median = computeMedian(amounts);
    const stdDev = computeStdDev(amounts, mean);

    for (const award of group) {
      const zScore = stdDev > 0 ? (award.awardAmount - mean) / stdDev : 0;
      rows.push([
        award.awardId,
        csvEscape(award.recipientName),
        award.awardAmount.toFixed(2),
        naics,
        csvEscape(award.naicsDescription ?? ""),
        mean.toFixed(2),
        median.toFixed(2),
        stdDev.toFixed(2),
        zScore.toFixed(3),
      ]);
    }
  }

  // Sort by absolute z-score descending to highlight outliers
  rows.sort((a, b) => Math.abs(parseFloat(b[8])) - Math.abs(parseFloat(a[8])));

  const filename = `${hypothesis.id}-price-analysis.csv`;
  await writeCsv(join(evidenceDir, filename), headers, rows);

  artifacts.push({
    id: `E-${hypothesis.id}-prices`,
    hypothesisId: hypothesis.id,
    type: "csv",
    title: "Price Analysis by NAICS Category",
    description: `${rows.length} awards with category-relative pricing statistics.`,
    filePath: `evidence/${filename}`,
    metadata: {
      totalAwards: rows.length,
      naicsCategories: byNaics.size,
      signalCount: signals.length,
    },
  });

  return artifacts;
}

// ─── Master Awards Summary ──────────────────────────────────────────────────

async function produceAwardsSummary(
  awards: NormalizedAward[],
  evidenceDir: string,
): Promise<EvidenceArtifact> {
  const headers = [
    "Award ID", "Recipient", "Agency", "Amount", "Type",
    "NAICS", "Start Date", "Extent Competed", "Offers Received",
    "Modifications", "Description",
  ];

  const rows = awards
    .sort((a, b) => b.awardAmount - a.awardAmount)
    .map((a) => [
      a.awardId,
      csvEscape(a.recipientName),
      csvEscape(a.awardingAgency),
      a.awardAmount.toFixed(2),
      a.awardType,
      a.naicsCode ?? "",
      a.startDate,
      a.extentCompeted ?? "",
      a.numberOfOffersReceived?.toString() ?? "",
      (a.modificationCount ?? 0).toString(),
      csvEscape((a.description ?? "").slice(0, 100)),
    ]);

  const filename = "awards-summary.csv";
  await writeCsv(join(evidenceDir, filename), headers, rows);

  return {
    id: "E-SUMMARY",
    hypothesisId: "ALL",
    type: "csv",
    title: "Master Awards Summary",
    description: `Complete dataset of ${awards.length} awards with key fields for review.`,
    filePath: `evidence/${filename}`,
    metadata: {
      totalAwards: awards.length,
      totalAmount: awards.reduce((s, a) => s + a.awardAmount, 0),
    },
  };
}

// ─── Helpers ────────────────────────────────────────────────────────────────

async function writeCsv(filePath: string, headers: string[], rows: string[][]): Promise<void> {
  const lines = [headers.join(","), ...rows.map((row) => row.join(","))];
  await writeFile(filePath, lines.join("\n"), "utf-8");
}

function csvEscape(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function describeCompetitionCode(code: string): string {
  const descriptions: Record<string, string> = {
    A: "Full and Open Competition",
    B: "Not Available for Competition",
    C: "Not Competed",
    D: "Full and Open after Exclusion of Sources",
    E: "Follow On to Competed Action",
    F: "Competed under SAP",
    G: "Not Competed under SAP",
    NDO: "Non-Domestic Offering",
    UNKNOWN: "Competition code not available",
  };
  return descriptions[code] ?? `Code: ${code}`;
}

function buildOfferDistribution(awards: NormalizedAward[]): string[][] {
  const dist = new Map<string, number>();
  let total = 0;

  for (const award of awards) {
    if (award.numberOfOffersReceived == null) {
      dist.set("N/A", (dist.get("N/A") ?? 0) + 1);
    } else {
      const key = award.numberOfOffersReceived.toString();
      dist.set(key, (dist.get(key) ?? 0) + 1);
    }
    total++;
  }

  return Array.from(dist.entries())
    .sort((a, b) => {
      if (a[0] === "N/A") return 1;
      if (b[0] === "N/A") return -1;
      return parseInt(a[0]) - parseInt(b[0]);
    })
    .map(([offers, count]) => [
      offers,
      count.toString(),
      total > 0 ? ((count / total) * 100).toFixed(1) : "0",
    ]);
}

function computeMedian(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function computeStdDev(values: number[], mean: number): number {
  if (values.length < 2) return 0;
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}
