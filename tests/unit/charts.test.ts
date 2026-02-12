/**
 * Unit tests for Vega-Lite chart spec builders and SVG renderer.
 * Spec builders are pure functions — easy to test.
 * SVG rendering validates that specs compile and produce valid output.
 */
import { describe, it, expect } from "vitest";
import { compile } from "vega-lite";
import {
  buildTopVendorsSpec,
  buildCompetitionAnalysisSpec,
  buildAwardTimelineSpec,
  buildFindingsExposureSpec,
} from "../../src/prover/charts.js";
import { renderChartToSvg } from "../../src/prover/renderer.js";
import type { NormalizedAward } from "../../src/normalizer/schema.js";
import type { MaterialFinding } from "../../src/shared/types.js";

// ─── Fixtures ───────────────────────────────────────────────────────────────

function makeAward(overrides: Partial<NormalizedAward> = {}): NormalizedAward {
  return {
    awardId: "CONT0001",
    internalId: "int-001",
    recipientName: "ACME Corp",
    awardingAgency: "Department of Defense",
    awardAmount: 500_000,
    awardType: "A",
    startDate: "2023-03-15",
    extentCompeted: "A",
    numberOfOffersReceived: 3,
    naicsCode: "541715",
    naicsDescription: "R&D in Physical Sciences",
    ...overrides,
  };
}

const sampleAwards: NormalizedAward[] = [
  makeAward({ awardId: "A1", recipientName: "ACME Corp", awardAmount: 500_000, extentCompeted: "A", startDate: "2023-03-15" }),
  makeAward({ awardId: "A2", recipientName: "ACME Corp", awardAmount: 300_000, extentCompeted: "C", startDate: "2023-04-10" }),
  makeAward({ awardId: "A3", recipientName: "Beta LLC", awardAmount: 150_000, extentCompeted: "B", startDate: "2023-04-20" }),
  makeAward({ awardId: "A4", recipientName: "Gamma Inc", awardAmount: 245_000, extentCompeted: "A", startDate: "2023-05-01" }),
  makeAward({ awardId: "A5", recipientName: "Gamma Inc", awardAmount: 100_000, extentCompeted: "C", startDate: "2023-06-15", naicsCode: "541511" }),
];

const sampleFindings: MaterialFinding[] = [
  {
    id: "F-R002-ACME",
    entityName: "ACME Corp",
    indicatorId: "R002",
    indicatorName: "Non-Competitive Awards",
    severity: "high",
    materialityScore: 100,
    totalDollarValue: 300_000,
    signalCount: 1,
    affectedAwardIds: ["A2"],
    signals: [],
    source: "signal_consolidation",
  },
  {
    id: "F-R004-GAMMA",
    entityName: "Gamma Inc",
    indicatorId: "R004",
    indicatorName: "Vendor Concentration",
    severity: "medium",
    materialityScore: 50,
    totalDollarValue: 345_000,
    signalCount: 1,
    affectedAwardIds: ["A4", "A5"],
    signals: [],
    source: "signal_consolidation",
  },
  {
    id: "F-R006-A1",
    entityName: "CONT0001 (ACME Corp)",
    indicatorId: "R006",
    indicatorName: "Price Outliers",
    severity: "high",
    materialityScore: 200,
    totalDollarValue: 500_000,
    signalCount: 1,
    affectedAwardIds: ["A1"],
    signals: [],
    source: "signal_consolidation",
  },
];

// ─── Top Vendors Spec ─────────────────────────────────────────────────────

describe("buildTopVendorsSpec", () => {
  it("produces a valid Vega-Lite spec with vendor bars", () => {
    const spec = buildTopVendorsSpec(sampleAwards, 700, 400);

    expect(spec.$schema).toContain("vega-lite");
    expect((spec.title as any).text).toBe("Who Got the Money?");

    const data = (spec as any).data?.values;
    expect(data).toBeDefined();
    expect(data.length).toBeGreaterThan(0);

    // ACME Corp should be in the data (highest total)
    const acmeEntries = data.filter((d: any) => d.vendor.includes("ACME"));
    expect(acmeEntries.length).toBeGreaterThan(0);

    // Should compile without error
    const result = compile(spec);
    expect(result.spec).toBeDefined();
  });

  it("limits to top 15 vendors", () => {
    // Create 20 different vendors
    const manyVendors = Array.from({ length: 20 }, (_, i) =>
      makeAward({
        awardId: `V${i}`,
        recipientName: `Vendor ${i}`,
        awardAmount: (20 - i) * 100_000,
      }),
    );

    const spec = buildTopVendorsSpec(manyVendors, 700, 400);
    const data = (spec as any).data?.values;
    const uniqueVendors = new Set(data.map((d: any) => d.vendor));
    expect(uniqueVendors.size).toBeLessThanOrEqual(15);
  });

  it("separates competitive and non-competitive amounts", () => {
    const spec = buildTopVendorsSpec(sampleAwards, 700, 400);
    const data = (spec as any).data?.values;

    const types = new Set(data.map((d: any) => d.type));
    expect(types.has("Competitive")).toBe(true);
    expect(types.has("Non-Competitive")).toBe(true);
  });
});

// ─── Competition Analysis Spec ───────────────────────────────────────────

describe("buildCompetitionAnalysisSpec", () => {
  it("produces a valid faceted Vega-Lite spec", () => {
    const spec = buildCompetitionAnalysisSpec(sampleAwards, 700, 400);

    expect(spec.$schema).toContain("vega-lite");
    expect((spec.title as any).text).toBe("How Competitive Was the Spending?");

    const data = (spec as any).data?.values;
    expect(data).toBeDefined();

    // Should have both "By Count" and "By Dollar Value" metrics
    const metrics = new Set(data.map((d: any) => d.metric));
    expect(metrics.has("By Count")).toBe(true);
    expect(metrics.has("By Dollar Value")).toBe(true);
  });

  it("maps competition codes to human-readable labels", () => {
    const spec = buildCompetitionAnalysisSpec(sampleAwards, 700, 400);
    const data = (spec as any).data?.values;
    const types = new Set(data.map((d: any) => d.type));

    expect(types.has("Full & Open")).toBe(true);
    expect(types.has("Not Competed")).toBe(true);
    // Should NOT contain raw codes
    expect(types.has("A")).toBe(false);
    expect(types.has("C")).toBe(false);
  });

  it("percentages sum to approximately 100 per metric", () => {
    const spec = buildCompetitionAnalysisSpec(sampleAwards, 700, 400);
    const data = (spec as any).data?.values;

    const byCountPcts = data
      .filter((d: any) => d.metric === "By Count")
      .reduce((sum: number, d: any) => sum + d.pct, 0);
    expect(byCountPcts).toBeCloseTo(100, 0);

    const byDollarPcts = data
      .filter((d: any) => d.metric === "By Dollar Value")
      .reduce((sum: number, d: any) => sum + d.pct, 0);
    expect(byDollarPcts).toBeCloseTo(100, 0);
  });
});

// ─── Award Timeline Spec ──────────────────────────────────────────────────

describe("buildAwardTimelineSpec", () => {
  it("produces a valid temporal bar chart spec", () => {
    const spec = buildAwardTimelineSpec(sampleAwards, 700, 400);

    expect(spec.$schema).toContain("vega-lite");
    expect((spec.title as any).text).toBe("When Did the Money Flow?");

    const data = (spec as any).data?.values;
    expect(data).toBeDefined();
    expect(data.length).toBeGreaterThan(0);

    // All month values should be valid dates
    for (const d of data) {
      expect(d.month).toMatch(/^\d{4}-\d{2}-01$/);
    }

    const result = compile(spec);
    expect(result.spec).toBeDefined();
  });

  it("groups awards into monthly buckets", () => {
    const spec = buildAwardTimelineSpec(sampleAwards, 700, 400);
    const data = (spec as any).data?.values;
    const months = new Set(data.map((d: any) => d.month));

    // Sample awards span March-June 2023
    expect(months.has("2023-03-01")).toBe(true);
    expect(months.has("2023-04-01")).toBe(true);
  });
});

// ─── Findings Exposure Spec ──────────────────────────────────────────────

describe("buildFindingsExposureSpec", () => {
  it("produces a valid horizontal bar chart spec", () => {
    const spec = buildFindingsExposureSpec(sampleFindings, 700, 400);

    expect(spec.$schema).toContain("vega-lite");
    expect((spec.title as any).text).toBe("What Should Be Investigated?");

    const data = (spec as any).data?.values;
    expect(data).toBeDefined();
    expect(data.length).toBe(3);

    const result = compile(spec);
    expect(result.spec).toBeDefined();
  });

  it("sorts findings by dollar exposure descending", () => {
    const spec = buildFindingsExposureSpec(sampleFindings, 700, 400);
    const data = (spec as any).data?.values;

    // First item should have highest exposure
    expect(data[0].exposure).toBeGreaterThanOrEqual(data[1].exposure);
    expect(data[1].exposure).toBeGreaterThanOrEqual(data[2].exposure);
  });

  it("color-codes by indicator type", () => {
    const spec = buildFindingsExposureSpec(sampleFindings, 700, 400);
    const data = (spec as any).data?.values;

    const indicators = new Set(data.map((d: any) => d.indicator));
    expect(indicators.has("Non-Competitive")).toBe(true);
    expect(indicators.has("Concentration")).toBe(true);
    expect(indicators.has("Price Outlier")).toBe(true);
  });

  it("limits to 16 findings", () => {
    const manyFindings = Array.from({ length: 25 }, (_, i) => ({
      ...sampleFindings[0],
      id: `F-R002-ENT${i}`,
      entityName: `Entity ${i}`,
      totalDollarValue: (25 - i) * 10_000,
    }));

    const spec = buildFindingsExposureSpec(manyFindings, 700, 400);
    const data = (spec as any).data?.values;
    expect(data.length).toBeLessThanOrEqual(16);
  });
});

// ─── SVG Rendering Tests ────────────────────────────────────────────────────

describe("SVG Renderer", () => {
  it("renders top vendors spec to valid SVG", async () => {
    const spec = buildTopVendorsSpec(sampleAwards, 700, 400);
    const svg = await renderChartToSvg(spec);

    expect(svg).toMatch(/^<svg/);
    expect(svg).toContain("</svg>");
    expect(svg.length).toBeGreaterThan(100);
  });

  it("renders award timeline spec to valid SVG", async () => {
    const spec = buildAwardTimelineSpec(sampleAwards, 700, 400);
    const svg = await renderChartToSvg(spec);

    expect(svg).toMatch(/^<svg/);
    expect(svg).toContain("</svg>");
  });

  it("renders findings exposure spec to valid SVG", async () => {
    const spec = buildFindingsExposureSpec(sampleFindings, 700, 400);
    const svg = await renderChartToSvg(spec);

    expect(svg).toMatch(/^<svg/);
    expect(svg).toContain("</svg>");
  });
});
