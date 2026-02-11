/**
 * Vega-Lite chart spec builders for visual evidence.
 * Each function builds a Vega-Lite JSON spec with inline data.
 * Priority: distribution, concentration, competition (80% of value).
 */
import type { TopLevelSpec } from "vega-lite";
import type { NormalizedAward } from "../normalizer/schema.js";
import type { Signal, ChartArtifact, ChartType } from "../shared/types.js";
import type { AppConfig } from "../cli/config.js";
import type { Transaction } from "../normalizer/schema.js";
import { renderChartToSvg } from "./renderer.js";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";

export interface ChartBuilderInput {
  awards: NormalizedAward[];
  signals: Signal[];
  transactions: Map<string, Transaction[]>;
  config: AppConfig;
  evidenceDir: string;
}

/**
 * Build all applicable chart specs based on detected signals.
 * Returns ChartArtifacts with embedded Vega-Lite specs.
 * Charts are written as SVG to the evidence directory.
 */
export async function buildCharts(input: ChartBuilderInput): Promise<ChartArtifact[]> {
  const { awards, signals, transactions, config, evidenceDir } = input;
  const chartConfig = config.charts;

  if (!chartConfig.enabled || awards.length === 0) {
    return [];
  }

  const artifacts: ChartArtifact[] = [];
  const { width, height } = chartConfig;

  // Always generate award distribution histogram
  if (chartConfig.types.awardDistribution) {
    const artifact = await buildAndRender(
      "award-distribution",
      buildAwardDistributionSpec(awards, width, height),
      "Award Amount Distribution",
      "Histogram of award amounts showing the distribution of contract values.",
      [],
      signals.map((s) => s.indicatorId),
      evidenceDir,
    );
    if (artifact) artifacts.push(artifact);
  }

  // Vendor concentration when R004 fires
  const hasR004 = signals.some((s) => s.indicatorId === "R004");
  if (chartConfig.types.vendorConcentration && hasR004) {
    const artifact = await buildAndRender(
      "vendor-concentration",
      buildVendorConcentrationSpec(awards, width, height),
      "Vendor Concentration",
      "Spending distribution across vendors showing market concentration.",
      signals.filter((s) => s.indicatorId === "R004").flatMap((s) => [`H-R004-${s.entityId}`]),
      ["R004"],
      evidenceDir,
    );
    if (artifact) artifacts.push(artifact);
  }

  // Competition breakdown when R001/R002 fire
  const hasCompetition = signals.some((s) => s.indicatorId === "R001" || s.indicatorId === "R002");
  if (chartConfig.types.competitionBreakdown && hasCompetition) {
    const artifact = await buildAndRender(
      "competition-breakdown",
      buildCompetitionBreakdownSpec(awards, width, height),
      "Competition Type Breakdown",
      "Stacked bar chart of competition types by awarding agency.",
      signals.filter((s) => ["R001", "R002"].includes(s.indicatorId)).flatMap((s) => [`H-${s.indicatorId}-${s.entityId}`]),
      ["R001", "R002"].filter((id) => signals.some((s) => s.indicatorId === id)),
      evidenceDir,
    );
    if (artifact) artifacts.push(artifact);
  }

  // Price outlier scatter when R006 fires
  const hasR006 = signals.some((s) => s.indicatorId === "R006");
  if (chartConfig.types.priceOutlier && hasR006) {
    const artifact = await buildAndRender(
      "price-outlier",
      buildPriceOutlierSpec(awards, signals, width, height),
      "Price Outlier Analysis",
      "Scatter plot of award amounts by NAICS code highlighting statistical outliers.",
      signals.filter((s) => s.indicatorId === "R006").flatMap((s) => [`H-R006-${s.entityId}`]),
      ["R006"],
      evidenceDir,
    );
    if (artifact) artifacts.push(artifact);
  }

  // Threshold clustering when R003 fires
  const hasR003 = signals.some((s) => s.indicatorId === "R003");
  if (chartConfig.types.thresholdClustering && hasR003) {
    const artifact = await buildAndRender(
      "threshold-clustering",
      buildThresholdClusteringSpec(awards, width, height),
      "Award Threshold Clustering",
      "Distribution of award amounts relative to regulatory thresholds ($250K, $7.5M).",
      signals.filter((s) => s.indicatorId === "R003").flatMap((s) => [`H-R003-${s.entityId}`]),
      ["R003"],
      evidenceDir,
    );
    if (artifact) artifacts.push(artifact);
  }

  // Modification timeline when R005 fires + transactions available
  const hasR005 = signals.some((s) => s.indicatorId === "R005");
  if (chartConfig.types.modificationTimeline && hasR005 && transactions.size > 0) {
    const artifact = await buildAndRender(
      "modification-timeline",
      buildModificationTimelineSpec(transactions, signals, width, height),
      "Contract Modification Timeline",
      "Timeline of contract modifications showing obligation changes over time.",
      signals.filter((s) => s.indicatorId === "R005").flatMap((s) => [`H-R005-${s.entityId}`]),
      ["R005"],
      evidenceDir,
    );
    if (artifact) artifacts.push(artifact);
  }

  return artifacts;
}

// ─── Spec Builders ──────────────────────────────────────────────────────────

export function buildAwardDistributionSpec(
  awards: NormalizedAward[],
  width: number,
  height: number,
): TopLevelSpec {
  const amounts = awards.map((a) => a.awardAmount).filter((a) => a > 0);
  const minAmount = Math.min(...amounts);
  const maxAmount = Math.max(...amounts);
  const useLogScale = amounts.length > 1 && maxAmount / minAmount > 100;

  if (useLogScale) {
    // Log-scale binning for highly skewed data
    const data = awards
      .filter((a) => a.awardAmount > 0)
      .map((a) => ({
        logAmount: Math.log10(a.awardAmount),
        recipient: a.recipientName,
      }));

    return {
      $schema: "https://vega.github.io/schema/vega-lite/v5.json",
      title: "Award Amount Distribution (log scale)",
      width,
      height,
      data: { values: data },
      mark: { type: "bar", tooltip: true },
      encoding: {
        x: {
          field: "logAmount",
          bin: { maxbins: 30 },
          type: "quantitative",
          title: "Award Amount (log₁₀ $)",
        },
        y: {
          aggregate: "count",
          type: "quantitative",
          title: "Number of Awards",
        },
        color: { value: "#4C78A8" },
      },
    };
  }

  const data = awards.map((a) => ({
    amount: a.awardAmount,
    recipient: a.recipientName,
  }));

  return {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    title: "Award Amount Distribution",
    width,
    height,
    data: { values: data },
    mark: { type: "bar", tooltip: true },
    encoding: {
      x: {
        field: "amount",
        bin: { maxbins: 30 },
        type: "quantitative",
        title: "Award Amount ($)",
        axis: { format: "~s" },
      },
      y: {
        aggregate: "count",
        type: "quantitative",
        title: "Number of Awards",
      },
      color: { value: "#4C78A8" },
    },
  };
}

export function buildVendorConcentrationSpec(
  awards: NormalizedAward[],
  width: number,
  height: number,
): TopLevelSpec {
  // Aggregate spending by vendor
  const vendorTotals = new Map<string, number>();
  for (const award of awards) {
    vendorTotals.set(
      award.recipientName,
      (vendorTotals.get(award.recipientName) ?? 0) + award.awardAmount,
    );
  }

  // Top 10 vendors + "Others"
  const sorted = [...vendorTotals.entries()].sort((a, b) => b[1] - a[1]);
  const top10 = sorted.slice(0, 10);
  const othersTotal = sorted.slice(10).reduce((sum, [, amt]) => sum + amt, 0);

  const data = top10.map(([vendor, amount]) => ({
    vendor: vendor.length > 30 ? vendor.slice(0, 27) + "..." : vendor,
    amount,
  }));
  if (othersTotal > 0) {
    data.push({ vendor: "Others", amount: othersTotal });
  }

  return {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    title: "Vendor Concentration (Top 10 by $ Value)",
    width,
    height,
    data: { values: data },
    mark: { type: "arc", innerRadius: 60, tooltip: true },
    encoding: {
      theta: { field: "amount", type: "quantitative" },
      color: {
        field: "vendor",
        type: "nominal",
        title: "Vendor",
        legend: { orient: "right" },
      },
      tooltip: [
        { field: "vendor", type: "nominal", title: "Vendor" },
        { field: "amount", type: "quantitative", title: "Total ($)", format: ",.0f" },
      ],
    },
  };
}

export function buildCompetitionBreakdownSpec(
  awards: NormalizedAward[],
  width: number,
  height: number,
): TopLevelSpec {
  const COMPETITION_LABELS: Record<string, string> = {
    A: "Full & Open",
    B: "Not Available",
    C: "Not Competed",
    D: "Full after Exclusion",
    E: "Follow On",
    F: "Competed (SAP)",
    G: "Not Competed (SAP)",
    NDO: "Non-Domestic",
  };

  const data = awards.map((a) => {
    const code = a.extentCompeted ?? "Unknown";
    return {
      agency: a.awardingAgency.length > 25
        ? a.awardingAgency.slice(0, 22) + "..."
        : a.awardingAgency,
      competition: COMPETITION_LABELS[code] ?? code,
      amount: a.awardAmount,
    };
  });

  return {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    title: "Competition Type by Agency",
    width,
    height,
    data: { values: data },
    mark: { type: "bar", tooltip: true },
    encoding: {
      x: {
        field: "agency",
        type: "nominal",
        title: "Awarding Agency",
        axis: { labelAngle: -45 },
      },
      y: {
        field: "amount",
        aggregate: "sum",
        type: "quantitative",
        title: "Total Award Amount ($)",
        axis: { format: "~s" },
      },
      color: {
        field: "competition",
        type: "nominal",
        title: "Competition Type",
        scale: {
          domain: ["Full & Open", "Not Competed", "Not Available", "Follow On", "Competed (SAP)", "Not Competed (SAP)", "Full after Exclusion", "Non-Domestic", "Unknown"],
          range: ["#4C78A8", "#E45756", "#F58518", "#72B7B2", "#54A24B", "#EECA3B", "#B279A2", "#FF9DA6", "#9D755D"],
        },
      },
      tooltip: [
        { field: "agency", type: "nominal", title: "Agency" },
        { field: "competition", type: "nominal", title: "Competition" },
        { field: "amount", aggregate: "sum", type: "quantitative", title: "Total ($)", format: ",.0f" },
      ],
    },
  };
}

export function buildPriceOutlierSpec(
  awards: NormalizedAward[],
  signals: Signal[],
  width: number,
  height: number,
): TopLevelSpec {
  const outlierAwardIds = new Set(
    signals
      .filter((s) => s.indicatorId === "R006")
      .flatMap((s) => s.affectedAwards),
  );

  const data = awards
    .filter((a) => a.naicsCode)
    .map((a) => ({
      awardId: a.awardId,
      amount: a.awardAmount,
      naics: a.naicsCode ?? "Unknown",
      recipient: a.recipientName.length > 20
        ? a.recipientName.slice(0, 17) + "..."
        : a.recipientName,
      outlier: outlierAwardIds.has(a.awardId) ? "Outlier" : "Normal",
    }));

  return {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    title: "Award Amounts by NAICS Code (Outliers Highlighted)",
    width,
    height,
    data: { values: data },
    mark: { type: "point", filled: true, tooltip: true },
    encoding: {
      x: {
        field: "naics",
        type: "nominal",
        title: "NAICS Code",
        axis: { labelAngle: -45 },
      },
      y: {
        field: "amount",
        type: "quantitative",
        title: "Award Amount ($)",
        axis: { format: "~s" },
        scale: { type: "log" },
      },
      color: {
        field: "outlier",
        type: "nominal",
        title: "Status",
        scale: {
          domain: ["Normal", "Outlier"],
          range: ["#4C78A8", "#E45756"],
        },
      },
      size: {
        condition: { test: "datum.outlier === 'Outlier'", value: 120 },
        value: 40,
      },
      tooltip: [
        { field: "awardId", type: "nominal", title: "Award ID" },
        { field: "recipient", type: "nominal", title: "Recipient" },
        { field: "amount", type: "quantitative", title: "Amount ($)", format: ",.0f" },
        { field: "naics", type: "nominal", title: "NAICS" },
      ],
    },
  };
}

export function buildThresholdClusteringSpec(
  awards: NormalizedAward[],
  width: number,
  height: number,
): TopLevelSpec {
  const thresholds = [250_000, 7_500_000];
  const bandPct = 0.10;

  const data = awards.map((a) => {
    let nearestThreshold = "";
    for (const t of thresholds) {
      const lower = t * (1 - bandPct);
      if (a.awardAmount >= lower && a.awardAmount <= t) {
        nearestThreshold = `Near $${(t / 1000).toFixed(0)}K`;
      }
    }
    return {
      amount: a.awardAmount,
      zone: nearestThreshold || "Normal",
      recipient: a.recipientName,
    };
  });

  // Layer: histogram + threshold rule lines
  return {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    title: "Award Amounts Near Regulatory Thresholds",
    width,
    height,
    layer: [
      {
        data: { values: data },
        mark: { type: "bar", tooltip: true },
        encoding: {
          x: {
            field: "amount",
            bin: { maxbins: 40 },
            type: "quantitative",
            title: "Award Amount ($)",
            axis: { format: "~s" },
          },
          y: {
            aggregate: "count",
            type: "quantitative",
            title: "Number of Awards",
          },
          color: {
            field: "zone",
            type: "nominal",
            title: "Threshold Zone",
            scale: {
              domain: ["Normal", "Near $250K", "Near $7500K"],
              range: ["#4C78A8", "#E45756", "#F58518"],
            },
          },
        },
      },
      // Threshold lines
      ...thresholds.map((t) => ({
        data: { values: [{ threshold: t }] },
        mark: {
          type: "rule" as const,
          color: "#E45756",
          strokeDash: [4, 4],
          strokeWidth: 2,
        },
        encoding: {
          x: { field: "threshold", type: "quantitative" as const },
        },
      })),
    ],
  } as TopLevelSpec;
}

export function buildModificationTimelineSpec(
  transactions: Map<string, Transaction[]>,
  signals: Signal[],
  width: number,
  height: number,
): TopLevelSpec {
  const affectedAwardIds = new Set(
    signals
      .filter((s) => s.indicatorId === "R005")
      .flatMap((s) => s.affectedAwards),
  );

  const data: Array<{ date: string; amount: number; awardId: string; cumulative: number }> = [];

  for (const [awardId, txns] of transactions) {
    if (!affectedAwardIds.has(awardId) && affectedAwardIds.size > 0) continue;

    let cumulative = 0;
    const sorted = [...txns].sort((a, b) => a.actionDate.localeCompare(b.actionDate));
    for (const txn of sorted) {
      cumulative += txn.federalActionObligation;
      data.push({
        date: txn.actionDate,
        amount: txn.federalActionObligation,
        awardId: awardId.length > 15 ? awardId.slice(0, 12) + "..." : awardId,
        cumulative,
      });
    }
  }

  return {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    title: "Contract Modification Timeline",
    width,
    height,
    data: { values: data },
    mark: { type: "line", point: true, tooltip: true },
    encoding: {
      x: {
        field: "date",
        type: "temporal",
        title: "Action Date",
      },
      y: {
        field: "cumulative",
        type: "quantitative",
        title: "Cumulative Obligation ($)",
        axis: { format: "~s" },
      },
      color: {
        field: "awardId",
        type: "nominal",
        title: "Award ID",
      },
      tooltip: [
        { field: "awardId", type: "nominal", title: "Award ID" },
        { field: "date", type: "temporal", title: "Date" },
        { field: "amount", type: "quantitative", title: "Modification ($)", format: ",.0f" },
        { field: "cumulative", type: "quantitative", title: "Cumulative ($)", format: ",.0f" },
      ],
    },
  };
}

// ─── Helpers ────────────────────────────────────────────────────────────────

async function buildAndRender(
  chartType: ChartType,
  spec: TopLevelSpec,
  title: string,
  description: string,
  hypothesisIds: string[],
  indicatorIds: string[],
  evidenceDir: string,
): Promise<ChartArtifact | null> {
  try {
    const svg = await renderChartToSvg(spec);
    const filename = `chart-${chartType}.svg`;
    await writeFile(join(evidenceDir, filename), svg, "utf-8");

    return {
      id: `C-${chartType}`,
      type: chartType,
      title,
      description,
      filePath: `evidence/${filename}`,
      hypothesisIds,
      indicatorIds,
      spec: spec as unknown as Record<string, unknown>,
    };
  } catch {
    // Graceful fallback: if rendering fails, skip this chart
    return null;
  }
}
