/**
 * Unit tests for Vega-Lite chart spec builders and SVG renderer.
 * Spec builders are pure functions — easy to test.
 * SVG rendering validates that specs compile and produce valid output.
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { compile } from "vega-lite";
import {
  buildAwardDistributionSpec,
  buildVendorConcentrationSpec,
  buildCompetitionBreakdownSpec,
  buildPriceOutlierSpec,
  buildThresholdClusteringSpec,
  buildModificationTimelineSpec,
} from "../../src/prover/charts.js";
import { renderChartToSvg } from "../../src/prover/renderer.js";
import type { NormalizedAward } from "../../src/normalizer/schema.js";
import type { Signal } from "../../src/shared/types.js";
import type { Transaction } from "../../src/normalizer/schema.js";

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
  makeAward({ awardId: "A1", recipientName: "ACME Corp", awardAmount: 500_000, extentCompeted: "A" }),
  makeAward({ awardId: "A2", recipientName: "ACME Corp", awardAmount: 300_000, extentCompeted: "C" }),
  makeAward({ awardId: "A3", recipientName: "Beta LLC", awardAmount: 150_000, extentCompeted: "B" }),
  makeAward({ awardId: "A4", recipientName: "Gamma Inc", awardAmount: 245_000, extentCompeted: "A" }),
  makeAward({ awardId: "A5", recipientName: "Gamma Inc", awardAmount: 100_000, extentCompeted: "C", naicsCode: "541511" }),
];

const sampleSignals: Signal[] = [
  {
    indicatorId: "R004",
    indicatorName: "Vendor Concentration",
    severity: "high",
    entityType: "recipient",
    entityId: "ACME",
    entityName: "ACME Corp",
    value: 0.6,
    threshold: 0.3,
    context: "60% concentration",
    affectedAwards: ["A1", "A2"],
  },
  {
    indicatorId: "R002",
    indicatorName: "Non-Competitive Awards",
    severity: "medium",
    entityType: "recipient",
    entityId: "ACME",
    entityName: "ACME Corp",
    value: 0.4,
    threshold: 0.2,
    context: "40% non-competitive",
    affectedAwards: ["A2", "A3"],
  },
  {
    indicatorId: "R006",
    indicatorName: "Price Outliers",
    severity: "medium",
    entityType: "award",
    entityId: "A1",
    entityName: "CONT0001",
    value: 3.2,
    threshold: 2.0,
    context: "Z-score 3.2",
    affectedAwards: ["A1"],
  },
  {
    indicatorId: "R003",
    indicatorName: "Contract Splitting",
    severity: "low",
    entityType: "recipient",
    entityId: "GAMMA",
    entityName: "Gamma Inc",
    value: 2,
    threshold: 3,
    context: "2 awards near $250K threshold",
    affectedAwards: ["A4"],
  },
];

// ─── Spec Builder Tests ─────────────────────────────────────────────────────

describe("Chart Spec Builders", () => {
  it("buildAwardDistributionSpec produces a valid Vega-Lite spec", () => {
    const spec = buildAwardDistributionSpec(sampleAwards, 600, 400);

    expect(spec.$schema).toContain("vega-lite");
    expect(spec.title).toBe("Award Amount Distribution");
    expect(spec.width).toBe(600);
    expect(spec.height).toBe(400);

    // Should compile without error
    const result = compile(spec);
    expect(result.spec).toBeDefined();
  });

  it("buildVendorConcentrationSpec produces a valid donut chart", () => {
    const spec = buildVendorConcentrationSpec(sampleAwards, 600, 400);

    expect(spec.$schema).toContain("vega-lite");
    expect(spec.title).toContain("Vendor Concentration");

    const result = compile(spec);
    expect(result.spec).toBeDefined();
  });

  it("buildVendorConcentrationSpec aggregates top 10 + others", () => {
    // Create 12 different vendors
    const manyVendors = Array.from({ length: 12 }, (_, i) =>
      makeAward({
        awardId: `V${i}`,
        recipientName: `Vendor ${i}`,
        awardAmount: (12 - i) * 100_000,
      }),
    );

    const spec = buildVendorConcentrationSpec(manyVendors, 600, 400);

    // Should have inline data with 11 entries (10 vendors + Others)
    const data = (spec as any).data?.values;
    expect(data).toBeDefined();
    expect(data.length).toBe(11);
    expect(data[data.length - 1].vendor).toBe("Others");
  });

  it("buildCompetitionBreakdownSpec maps competition codes to labels", () => {
    const spec = buildCompetitionBreakdownSpec(sampleAwards, 600, 400);

    expect(spec.$schema).toContain("vega-lite");

    const data = (spec as any).data?.values;
    expect(data).toBeDefined();

    const labels = data.map((d: any) => d.competition);
    expect(labels).toContain("Full & Open");
    expect(labels).toContain("Not Competed");

    const result = compile(spec);
    expect(result.spec).toBeDefined();
  });

  it("buildPriceOutlierSpec marks outlier awards", () => {
    const spec = buildPriceOutlierSpec(sampleAwards, sampleSignals, 600, 400);

    const data = (spec as any).data?.values;
    expect(data).toBeDefined();

    const outliers = data.filter((d: any) => d.outlier === "Outlier");
    const normals = data.filter((d: any) => d.outlier === "Normal");
    expect(outliers.length).toBeGreaterThan(0);
    expect(normals.length).toBeGreaterThan(0);

    const result = compile(spec);
    expect(result.spec).toBeDefined();
  });

  it("buildThresholdClusteringSpec identifies awards near thresholds", () => {
    const spec = buildThresholdClusteringSpec(sampleAwards, 600, 400);

    expect(spec.$schema).toContain("vega-lite");
    // Layered spec with histogram + rule lines
    expect((spec as any).layer).toBeDefined();
    expect((spec as any).layer.length).toBeGreaterThanOrEqual(2);

    // The $245K award should be flagged as near $250K
    const histogramData = (spec as any).layer[0].data?.values;
    const nearThreshold = histogramData?.filter((d: any) => d.zone !== "Normal");
    expect(nearThreshold?.length).toBeGreaterThan(0);
  });

  it("buildModificationTimelineSpec produces timeline from transactions", () => {
    const transactions = new Map<string, Transaction[]>();
    transactions.set("A1", [
      { id: 1, awardId: "A1", modificationNumber: "0", actionDate: "2023-01-15", federalActionObligation: 100_000 },
      { id: 2, awardId: "A1", modificationNumber: "1", actionDate: "2023-06-15", federalActionObligation: 50_000 },
    ]);

    const r005Signal: Signal = {
      indicatorId: "R005",
      indicatorName: "Excessive Modifications",
      severity: "medium",
      entityType: "award",
      entityId: "A1",
      entityName: "A1",
      value: 2,
      threshold: 5,
      context: "2 modifications",
      affectedAwards: ["A1"],
    };

    const spec = buildModificationTimelineSpec(transactions, [r005Signal], 600, 400);

    const data = (spec as any).data?.values;
    expect(data).toBeDefined();
    expect(data.length).toBe(2);

    // Cumulative values should increase
    expect(data[0].cumulative).toBe(100_000);
    expect(data[1].cumulative).toBe(150_000);

    const result = compile(spec);
    expect(result.spec).toBeDefined();
  });
});

// ─── Adaptive Binning Tests ──────────────────────────────────────────────────

describe("Adaptive Binning", () => {
  it("uses log scale when data range spans >100x", () => {
    const skewedAwards = [
      makeAward({ awardId: "S1", awardAmount: 7_900 }),
      makeAward({ awardId: "S2", awardAmount: 50_000 }),
      makeAward({ awardId: "S3", awardAmount: 500_000 }),
      makeAward({ awardId: "S4", awardAmount: 5_000_000 }),
      makeAward({ awardId: "S5", awardAmount: 1_590_000_000 }),
    ];

    const spec = buildAwardDistributionSpec(skewedAwards, 600, 400);

    expect(spec.title).toContain("log scale");
    const data = (spec as any).data?.values;
    expect(data[0]).toHaveProperty("logAmount");

    const result = compile(spec);
    expect(result.spec).toBeDefined();
  });

  it("uses linear scale when data range is within 100x", () => {
    const uniformAwards = [
      makeAward({ awardId: "U1", awardAmount: 100_000 }),
      makeAward({ awardId: "U2", awardAmount: 200_000 }),
      makeAward({ awardId: "U3", awardAmount: 300_000 }),
      makeAward({ awardId: "U4", awardAmount: 500_000 }),
    ];

    const spec = buildAwardDistributionSpec(uniformAwards, 600, 400);

    expect(spec.title).toBe("Award Amount Distribution");
    const data = (spec as any).data?.values;
    expect(data[0]).toHaveProperty("amount");
  });
});

// ─── SVG Rendering Tests ────────────────────────────────────────────────────

describe("SVG Renderer", () => {
  it("renders award distribution spec to valid SVG", async () => {
    const spec = buildAwardDistributionSpec(sampleAwards, 600, 400);
    const svg = await renderChartToSvg(spec);

    expect(svg).toMatch(/^<svg/);
    expect(svg).toContain("</svg>");
    expect(svg.length).toBeGreaterThan(100);
  });

  it("renders vendor concentration spec to valid SVG", async () => {
    const spec = buildVendorConcentrationSpec(sampleAwards, 600, 400);
    const svg = await renderChartToSvg(spec);

    expect(svg).toMatch(/^<svg/);
    expect(svg).toContain("</svg>");
  });

  it("renders competition breakdown spec to valid SVG", async () => {
    const spec = buildCompetitionBreakdownSpec(sampleAwards, 600, 400);
    const svg = await renderChartToSvg(spec);

    expect(svg).toMatch(/^<svg/);
    expect(svg).toContain("</svg>");
  });
});
