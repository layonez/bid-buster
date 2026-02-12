/**
 * Vega-Lite chart spec builders for visual evidence.
 * 4 clear, compelling charts designed for hackathon demo impact:
 *   1. Top Vendors by Dollar Value (horizontal bar)
 *   2. Competition Analysis (donut by count + by dollar value)
 *   3. Award Timeline by Month (stacked bar, competed vs non-competed)
 *   4. Material Findings by Exposure (horizontal bar, color by indicator)
 */
import type { TopLevelSpec } from "vega-lite";
import type { NormalizedAward } from "../normalizer/schema.js";
import type { Signal, ChartArtifact, ChartType, MaterialFinding } from "../shared/types.js";
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
  materialFindings?: MaterialFinding[];
}

// ─── Dollar Formatting ───────────────────────────────────────────────────────

function formatDollars(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

// ─── Competition Label Mapping ───────────────────────────────────────────────

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

function getCompetitionLabel(code: string | undefined): string {
  if (!code) return "Unknown";
  return COMPETITION_LABELS[code] ?? code;
}

function isNonCompetitive(code: string | undefined): boolean {
  return ["B", "C", "G", "NDO"].includes(code ?? "");
}

// ─── Color Palette ───────────────────────────────────────────────────────────

const COLORS = {
  competitive: "#2563EB",     // blue-600
  nonCompetitive: "#DC2626",  // red-600
  mixedWarm: "#EA580C",       // orange-600
  neutral: "#6B7280",         // gray-500
  indicators: {
    R001: "#2563EB",  // blue
    R002: "#DC2626",  // red
    R003: "#059669",  // emerald
    R004: "#7C3AED",  // purple
    R005: "#D97706",  // amber
    R006: "#EA580C",  // orange
  } as Record<string, string>,
};

/**
 * Build all applicable chart specs based on detected signals.
 * Returns ChartArtifacts with embedded Vega-Lite specs.
 * Charts are written as SVG to the evidence directory.
 */
export async function buildCharts(input: ChartBuilderInput): Promise<ChartArtifact[]> {
  const { awards, signals, config, evidenceDir, materialFindings } = input;
  const chartConfig = config.charts;

  if (!chartConfig.enabled || awards.length === 0) {
    return [];
  }

  const artifacts: ChartArtifact[] = [];
  const { width, height } = chartConfig;

  // Chart 1: Top Vendors by Dollar Value
  if (chartConfig.types.topVendors) {
    const artifact = await buildAndRender(
      "top-vendors",
      buildTopVendorsSpec(awards, width, height),
      "Who Got the Money?",
      "Top 15 vendors ranked by total award amount, color-coded by competition status.",
      [],
      signals.map((s) => s.indicatorId),
      evidenceDir,
    );
    if (artifact) artifacts.push(artifact);
  }

  // Chart 2: Competition Analysis
  if (chartConfig.types.competitionAnalysis) {
    const artifact = await buildAndRender(
      "competition-analysis",
      buildCompetitionAnalysisSpec(awards, width, height),
      "How Competitive Was the Spending?",
      "Breakdown of awards by competition type: count vs. dollar value.",
      [],
      ["R001", "R002"].filter((id) => signals.some((s) => s.indicatorId === id)),
      evidenceDir,
    );
    if (artifact) artifacts.push(artifact);
  }

  // Chart 3: Award Timeline by Month
  if (chartConfig.types.awardTimeline) {
    const artifact = await buildAndRender(
      "award-timeline",
      buildAwardTimelineSpec(awards, width, height),
      "When Did the Money Flow?",
      "Monthly award spending, segmented by competition status.",
      [],
      signals.map((s) => s.indicatorId),
      evidenceDir,
    );
    if (artifact) artifacts.push(artifact);
  }

  // Chart 4: Material Findings by Exposure
  if (chartConfig.types.findingsExposure && materialFindings && materialFindings.length > 0) {
    const artifact = await buildAndRender(
      "findings-exposure",
      buildFindingsExposureSpec(materialFindings, width, height),
      "What Should Be Investigated?",
      "Top findings ranked by dollar exposure, color-coded by indicator type.",
      materialFindings.map((f) => f.id),
      [...new Set(materialFindings.map((f) => f.indicatorId))],
      evidenceDir,
    );
    if (artifact) artifacts.push(artifact);
  }

  return artifacts;
}

// ─── Chart 1: Top Vendors by Dollar Value ─────────────────────────────────

export function buildTopVendorsSpec(
  awards: NormalizedAward[],
  width: number,
  height: number,
): TopLevelSpec {
  // Aggregate by vendor and competition status
  const vendorData = new Map<string, { competitive: number; nonCompetitive: number; total: number }>();

  for (const award of awards) {
    const name = award.recipientName;
    const entry = vendorData.get(name) ?? { competitive: 0, nonCompetitive: 0, total: 0 };
    const amount = Math.max(0, award.awardAmount);
    if (isNonCompetitive(award.extentCompeted)) {
      entry.nonCompetitive += amount;
    } else {
      entry.competitive += amount;
    }
    entry.total += amount;
    vendorData.set(name, entry);
  }

  // Top 15 vendors sorted by total
  const sorted = [...vendorData.entries()]
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 15);

  // Build flat data for stacked horizontal bar
  const data: Array<{ vendor: string; amount: number; type: string; label: string; sortOrder: number }> = [];
  for (let i = 0; i < sorted.length; i++) {
    const [vendor, amounts] = sorted[i];
    const shortName = vendor.length > 35 ? vendor.slice(0, 32) + "..." : vendor;
    const totalLabel = formatDollars(amounts.total);
    if (amounts.competitive > 0) {
      data.push({
        vendor: shortName,
        amount: amounts.competitive,
        type: "Competitive",
        label: totalLabel,
        sortOrder: i,
      });
    }
    if (amounts.nonCompetitive > 0) {
      data.push({
        vendor: shortName,
        amount: amounts.nonCompetitive,
        type: "Non-Competitive",
        label: totalLabel,
        sortOrder: i,
      });
    }
  }

  return {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    title: { text: "Who Got the Money?", subtitle: "Top 15 vendors by total award value" },
    width: width,
    height: Math.max(height, sorted.length * 28 + 60),
    data: { values: data },
    mark: { type: "bar", tooltip: true },
    encoding: {
      y: {
        field: "vendor",
        type: "nominal",
        title: null,
        sort: { field: "sortOrder", order: "ascending" },
        axis: { labelLimit: 280 },
      },
      x: {
        field: "amount",
        type: "quantitative",
        title: "Total Award Amount",
        stack: "zero",
        axis: { format: "~s", labelExpr: "'$' + datum.label" },
      },
      color: {
        field: "type",
        type: "nominal",
        title: "Competition Status",
        scale: {
          domain: ["Competitive", "Non-Competitive"],
          range: [COLORS.competitive, COLORS.nonCompetitive],
        },
        legend: { orient: "top" },
      },
      tooltip: [
        { field: "vendor", type: "nominal", title: "Vendor" },
        { field: "type", type: "nominal", title: "Status" },
        { field: "amount", type: "quantitative", title: "Amount ($)", format: ",.0f" },
      ],
    },
  } as TopLevelSpec;
}

// ─── Chart 2: Competition Analysis ────────────────────────────────────────

export function buildCompetitionAnalysisSpec(
  awards: NormalizedAward[],
  width: number,
  height: number,
): TopLevelSpec {
  // Aggregate by competition type: count and dollar value
  const byType = new Map<string, { count: number; dollars: number }>();

  for (const award of awards) {
    const label = getCompetitionLabel(award.extentCompeted);
    const entry = byType.get(label) ?? { count: 0, dollars: 0 };
    entry.count += 1;
    entry.dollars += Math.max(0, award.awardAmount);
    byType.set(label, entry);
  }

  // Sort by dollar value descending
  const sorted = [...byType.entries()].sort((a, b) => b[1].dollars - a[1].dollars);

  // Build data for grouped bar (by count and by dollars)
  const data: Array<{ type: string; metric: string; value: number; pct: number }> = [];
  const totalCount = awards.length;
  const totalDollars = sorted.reduce((sum, [, v]) => sum + v.dollars, 0);

  for (const [label, vals] of sorted) {
    data.push({
      type: label,
      metric: "By Count",
      value: vals.count,
      pct: totalCount > 0 ? (vals.count / totalCount) * 100 : 0,
    });
    data.push({
      type: label,
      metric: "By Dollar Value",
      value: vals.dollars,
      pct: totalDollars > 0 ? (vals.dollars / totalDollars) * 100 : 0,
    });
  }

  // Determine which types are non-competitive for coloring
  const nonCompLabels = new Set(["Not Competed", "Not Available", "Not Competed (SAP)", "Non-Domestic"]);
  const typeColors: string[] = sorted.map(([label]) =>
    nonCompLabels.has(label) ? COLORS.nonCompetitive :
    label === "Full & Open" ? COLORS.competitive :
    label === "Full after Exclusion" ? "#3B82F6" :
    label === "Competed (SAP)" ? "#60A5FA" :
    label === "Follow On" ? COLORS.mixedWarm :
    COLORS.neutral,
  );

  return {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    title: { text: "How Competitive Was the Spending?", subtitle: "Awards by competition type (count vs. dollar value)" },
    width: width,
    height: height,
    data: { values: data },
    facet: {
      column: {
        field: "metric",
        type: "nominal",
        title: null,
        header: { labelFontSize: 13, labelFontWeight: "bold" as const },
      },
    },
    spec: {
      width: (width / 2) - 40,
      height: height - 100,
      mark: { type: "bar", tooltip: true },
      encoding: {
        y: {
          field: "type",
          type: "nominal",
          title: null,
          sort: { field: "pct", order: "descending" },
          axis: { labelLimit: 200 },
        },
        x: {
          field: "pct",
          type: "quantitative",
          title: "% of Total",
          axis: { format: ".0f" },
        },
        color: {
          field: "type",
          type: "nominal",
          title: "Competition Type",
          scale: {
            domain: sorted.map(([label]) => label),
            range: typeColors,
          },
          legend: { orient: "bottom", columns: 3 },
        },
        tooltip: [
          { field: "type", type: "nominal", title: "Type" },
          { field: "pct", type: "quantitative", title: "Percentage", format: ".1f" },
          { field: "value", type: "quantitative", title: "Value", format: ",.0f" },
        ],
      },
    },
  } as unknown as TopLevelSpec;
}

// ─── Chart 3: Award Timeline by Month ─────────────────────────────────────

export function buildAwardTimelineSpec(
  awards: NormalizedAward[],
  width: number,
  height: number,
): TopLevelSpec {
  // Group awards by month and competition status
  const monthData = new Map<string, { competitive: number; nonCompetitive: number }>();

  for (const award of awards) {
    if (!award.startDate) continue;
    // Extract YYYY-MM from the start date
    const month = award.startDate.slice(0, 7);
    if (!month || month.length < 7) continue;

    const entry = monthData.get(month) ?? { competitive: 0, nonCompetitive: 0 };
    const amount = Math.max(0, award.awardAmount);
    if (isNonCompetitive(award.extentCompeted)) {
      entry.nonCompetitive += amount;
    } else {
      entry.competitive += amount;
    }
    monthData.set(month, entry);
  }

  // Sort by month
  const sorted = [...monthData.entries()].sort((a, b) => a[0].localeCompare(b[0]));

  // Build flat data for stacked bar
  const data: Array<{ month: string; amount: number; type: string }> = [];
  for (const [month, amounts] of sorted) {
    // Use first day of month for temporal axis
    const dateStr = `${month}-01`;
    if (amounts.competitive > 0) {
      data.push({ month: dateStr, amount: amounts.competitive, type: "Competitive" });
    }
    if (amounts.nonCompetitive > 0) {
      data.push({ month: dateStr, amount: amounts.nonCompetitive, type: "Non-Competitive" });
    }
  }

  return {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    title: { text: "When Did the Money Flow?", subtitle: "Monthly award amounts by competition status" },
    width: width,
    height: height,
    data: { values: data },
    mark: { type: "bar", tooltip: true },
    encoding: {
      x: {
        field: "month",
        type: "temporal",
        title: null,
        timeUnit: "yearmonth",
        axis: { format: "%b %Y", labelAngle: -45 },
      },
      y: {
        field: "amount",
        type: "quantitative",
        title: "Award Amount",
        stack: "zero",
        axis: { format: "~s", labelExpr: "'$' + datum.label" },
      },
      color: {
        field: "type",
        type: "nominal",
        title: "Competition Status",
        scale: {
          domain: ["Competitive", "Non-Competitive"],
          range: [COLORS.competitive, COLORS.nonCompetitive],
        },
        legend: { orient: "top" },
      },
      tooltip: [
        { field: "month", type: "temporal", title: "Month", timeUnit: "yearmonth", format: "%B %Y" },
        { field: "type", type: "nominal", title: "Status" },
        { field: "amount", type: "quantitative", title: "Amount ($)", format: ",.0f" },
      ],
    },
  } as TopLevelSpec;
}

// ─── Chart 4: Material Findings by Exposure ───────────────────────────────

export function buildFindingsExposureSpec(
  findings: MaterialFinding[],
  width: number,
  height: number,
): TopLevelSpec {
  // Sort findings by dollar exposure descending, take top 16
  const sorted = [...findings]
    .sort((a, b) => b.totalDollarValue - a.totalDollarValue)
    .slice(0, 16);

  const indicatorNames: Record<string, string> = {
    R001: "Single-Bid",
    R002: "Non-Competitive",
    R003: "Splitting",
    R004: "Concentration",
    R005: "Modifications",
    R006: "Price Outlier",
  };

  const data = sorted.map((f, i) => {
    // Compose a short label: entity + indicator
    const entityShort = f.entityName.length > 25 ? f.entityName.slice(0, 22) + "..." : f.entityName;
    const indicLabel = indicatorNames[f.indicatorId] ?? f.indicatorId;
    return {
      finding: `${entityShort}`,
      indicator: indicLabel,
      indicatorId: f.indicatorId,
      exposure: f.totalDollarValue,
      label: formatDollars(f.totalDollarValue),
      severity: f.severity,
      sortOrder: i,
    };
  });

  // Build indicator domain and range from what's actually in the data
  const usedIndicators = [...new Set(data.map((d) => d.indicator))];
  const usedColors = usedIndicators.map((name) => {
    const id = Object.entries(indicatorNames).find(([, v]) => v === name)?.[0] ?? "";
    return COLORS.indicators[id] ?? COLORS.neutral;
  });

  return {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    title: { text: "What Should Be Investigated?", subtitle: "Material findings ranked by dollar exposure" },
    width: width,
    height: Math.max(height, sorted.length * 28 + 60),
    data: { values: data },
    mark: { type: "bar", tooltip: true },
    encoding: {
      y: {
        field: "finding",
        type: "nominal",
        title: null,
        sort: { field: "sortOrder", order: "ascending" },
        axis: { labelLimit: 280 },
      },
      x: {
        field: "exposure",
        type: "quantitative",
        title: "Dollar Exposure",
        axis: { format: "~s", labelExpr: "'$' + datum.label" },
      },
      color: {
        field: "indicator",
        type: "nominal",
        title: "Indicator",
        scale: {
          domain: usedIndicators,
          range: usedColors,
        },
        legend: { orient: "top" },
      },
      tooltip: [
        { field: "finding", type: "nominal", title: "Entity" },
        { field: "indicator", type: "nominal", title: "Indicator" },
        { field: "exposure", type: "quantitative", title: "Exposure ($)", format: ",.0f" },
        { field: "severity", type: "nominal", title: "Severity" },
      ],
    },
  } as TopLevelSpec;
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
      filePath: `evidence/charts/${filename}`,
      hypothesisIds,
      indicatorIds,
      spec: spec as unknown as Record<string, unknown>,
    };
  } catch {
    // Graceful fallback: if rendering fails, skip this chart
    return null;
  }
}
