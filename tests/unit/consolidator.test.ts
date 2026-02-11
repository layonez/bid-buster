/**
 * Tests for signal consolidation, convergence analysis, and finding ID slugification.
 */
import { describe, it, expect } from "vitest";
import { consolidateSignals, computeConvergence, slugifyFindingId } from "../../src/signaler/consolidator.js";
import type { Signal, MaterialFinding } from "../../src/shared/types.js";
import type { NormalizedAward } from "../../src/normalizer/schema.js";

// ─── Fixtures ────────────────────────────────────────────────────────────────

const makeSignal = (overrides: Partial<Signal> = {}): Signal => ({
  indicatorId: "R002",
  indicatorName: "Non-Competitive Awards",
  severity: "high",
  entityType: "recipient",
  entityId: "ACME-CORP",
  entityName: "ACME CORPORATION",
  value: 0.85,
  threshold: 0.5,
  context: "85% of awards to ACME CORPORATION were non-competitive",
  affectedAwards: ["AWARD-001", "AWARD-002"],
  ...overrides,
});

const makeAward = (overrides: Partial<NormalizedAward> = {}): NormalizedAward => ({
  awardId: "AWARD-001",
  internalId: "INT-001",
  recipientName: "ACME CORPORATION",
  awardingAgency: "Department of Defense",
  awardAmount: 500000,
  awardType: "A",
  startDate: "2023-03-15",
  ...overrides,
});

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("consolidateSignals", () => {
  it("groups signals by entity and indicator", () => {
    const signals = [
      makeSignal({ entityName: "ACME", indicatorId: "R002", affectedAwards: ["A1"] }),
      makeSignal({ entityName: "ACME", indicatorId: "R002", affectedAwards: ["A2"] }),
      makeSignal({ entityName: "OTHER", indicatorId: "R002", affectedAwards: ["A3"] }),
    ];

    const awards = [
      makeAward({ awardId: "A1", awardAmount: 100000 }),
      makeAward({ awardId: "A2", awardAmount: 200000 }),
      makeAward({ awardId: "A3", awardAmount: 50000 }),
    ];

    const findings = consolidateSignals(signals, awards);
    expect(findings).toHaveLength(2);
    // ACME should be first (higher dollar value)
    expect(findings[0].entityName).toBe("ACME");
    expect(findings[0].affectedAwardIds).toContain("A1");
    expect(findings[0].affectedAwardIds).toContain("A2");
    expect(findings[0].signalCount).toBe(2);
  });

  it("computes dollar-weighted materiality score", () => {
    const signals = [
      makeSignal({ severity: "high", affectedAwards: ["A1"] }),
    ];

    const awards = [
      makeAward({ awardId: "A1", awardAmount: 1000000 }),
    ];

    const findings = consolidateSignals(signals, awards);
    expect(findings).toHaveLength(1);
    expect(findings[0].materialityScore).toBeGreaterThan(0);
    expect(findings[0].totalDollarValue).toBe(1000000);
  });

  it("sorts by materiality score descending", () => {
    const signals = [
      makeSignal({ entityName: "SMALL", indicatorId: "R001", severity: "low", affectedAwards: ["A1"] }),
      makeSignal({ entityName: "BIG", indicatorId: "R002", severity: "high", affectedAwards: ["A2"] }),
    ];

    const awards = [
      makeAward({ awardId: "A1", awardAmount: 1000 }),
      makeAward({ awardId: "A2", awardAmount: 10000000 }),
    ];

    const findings = consolidateSignals(signals, awards);
    expect(findings[0].entityName).toBe("BIG");
  });

  it("respects maxFindings limit", () => {
    const signals = Array.from({ length: 30 }, (_, i) =>
      makeSignal({
        entityName: `ENTITY-${i}`,
        entityId: `E-${i}`,
        indicatorId: "R002",
        affectedAwards: [`A-${i}`],
      }),
    );

    const awards = signals.map((s) =>
      makeAward({ awardId: s.affectedAwards[0], awardAmount: 100000 }),
    );

    const findings = consolidateSignals(signals, awards, { maxFindings: 10 });
    expect(findings.length).toBeLessThanOrEqual(10);
  });

  it("filters by minAwardCount", () => {
    const signals = [
      makeSignal({ affectedAwards: ["A1"] }),
    ];

    const awards = [makeAward({ awardId: "A1", awardAmount: 100 })];

    const findings = consolidateSignals(signals, awards, { minAwardCount: 5 });
    expect(findings).toHaveLength(0);
  });

  it("returns empty for empty signals", () => {
    expect(consolidateSignals([], [])).toEqual([]);
  });

  it("uses highest severity from group", () => {
    const signals = [
      makeSignal({ severity: "low", affectedAwards: ["A1"] }),
      makeSignal({ severity: "high", affectedAwards: ["A2"] }),
    ];

    const awards = [
      makeAward({ awardId: "A1", awardAmount: 100 }),
      makeAward({ awardId: "A2", awardAmount: 200 }),
    ];

    const findings = consolidateSignals(signals, awards);
    expect(findings[0].severity).toBe("high");
  });

  it("sets source to signal_consolidation and aiTag to RULE", () => {
    const signals = [makeSignal()];
    const awards = [makeAward()];

    const findings = consolidateSignals(signals, awards);
    expect(findings[0].source).toBe("signal_consolidation");
    expect(findings[0].aiTag).toBe("RULE");
  });

  it("enforces per-indicator diversity cap", () => {
    // Create 10 R006 signals (high dollar) and 3 R002 signals (lower dollar)
    const signals: Signal[] = [];
    const awards: NormalizedAward[] = [];

    for (let i = 0; i < 10; i++) {
      signals.push(
        makeSignal({
          entityName: `OUTLIER-${i}`,
          entityId: `O-${i}`,
          indicatorId: "R006",
          indicatorName: "Price Outliers",
          severity: "high",
          affectedAwards: [`R6-${i}`],
        }),
      );
      awards.push(makeAward({ awardId: `R6-${i}`, awardAmount: 50_000_000 + i }));
    }

    for (let i = 0; i < 3; i++) {
      signals.push(
        makeSignal({
          entityName: `NONCOMP-${i}`,
          entityId: `NC-${i}`,
          indicatorId: "R002",
          indicatorName: "Non-Competitive Awards",
          severity: "medium",
          affectedAwards: [`R2-${i}`],
        }),
      );
      awards.push(makeAward({ awardId: `R2-${i}`, awardAmount: 100_000 }));
    }

    const findings = consolidateSignals(signals, awards, { maxFindings: 10, maxPerIndicator: 5 });

    // R006 should be capped at 5 even though it has 10 high-dollar findings
    const r006Count = findings.filter((f) => f.indicatorId === "R006").length;
    const r002Count = findings.filter((f) => f.indicatorId === "R002").length;

    expect(r006Count).toBeLessThanOrEqual(5);
    expect(r002Count).toBe(3); // All 3 R002 findings should appear
    expect(findings.length).toBe(8); // 5 R006 + 3 R002
  });

  it("generates slugified finding IDs", () => {
    const signals = [
      makeSignal({
        entityName: "Department of Defense",
        indicatorId: "R003",
        affectedAwards: ["A1"],
      }),
    ];
    const awards = [makeAward({ awardId: "A1" })];

    const findings = consolidateSignals(signals, awards);
    expect(findings[0].id).toMatch(/^F-R003-DEPAR-OF-SPLITTING$/);
  });

  it("includes entity context in findings", () => {
    const signals = [
      makeSignal({ affectedAwards: ["A1"] }),
    ];
    const awards = [
      makeAward({
        awardId: "A1",
        recipientName: "ACME CORPORATION",
        naicsDescription: "Computer Systems Design",
        typeSetAside: "SBA",
        startDate: "2023-01-15",
      }),
    ];

    const findings = consolidateSignals(signals, awards);
    expect(findings[0].entityContext).toBeDefined();
    expect(findings[0].entityContext!.naicsDescription).toBe("Computer Systems Design");
    expect(findings[0].entityContext!.setAsideType).toBe("SBA");
    expect(findings[0].entityContext!.totalAwardsInDataset).toBe(1);
    expect(findings[0].entityContext!.firstAwardDate).toBe("2023-01-15");
  });
});

// ─── Slugification Tests ────────────────────────────────────────────────────

describe("slugifyFindingId", () => {
  it("creates readable slugs from entity names", () => {
    const ids = new Set<string>();
    expect(slugifyFindingId("R003", "Department of Defense", ids)).toBe("F-R003-DEPAR-OF-SPLITTING");
    expect(slugifyFindingId("R002", "ADVANCED ELECTRONICS INC", ids)).toBe("F-R002-ADVAN-ELECT-NONCOMP");
    expect(slugifyFindingId("R006", "MIT", ids)).toBe("F-R006-MIT-OUTLIER");
  });

  it("handles single-word entity names", () => {
    const ids = new Set<string>();
    expect(slugifyFindingId("R001", "BOEING", ids)).toBe("F-R001-BOEING-SINGLEBID");
  });

  it("ensures uniqueness with counter suffix", () => {
    const ids = new Set<string>();
    const id1 = slugifyFindingId("R002", "ACME CORP", ids);
    const id2 = slugifyFindingId("R002", "ACME CORP", ids);
    expect(id1).not.toBe(id2);
    expect(id2).toContain("-2");
  });

  it("handles empty entity name", () => {
    const ids = new Set<string>();
    expect(slugifyFindingId("R001", "", ids)).toBe("F-R001-UNKNOWN-SINGLEBID");
  });

  it("strips special characters", () => {
    const ids = new Set<string>();
    const id = slugifyFindingId("R004", "L3Harris Technologies, Inc.", ids);
    expect(id).toMatch(/^F-R004-L3HAR-TECHN-CONCENTRATION$/);
  });
});

// ─── Convergence Tests ──────────────────────────────────────────────────────

describe("computeConvergence", () => {
  const makeFinding = (overrides: Partial<MaterialFinding> = {}): MaterialFinding => ({
    id: "F-TEST",
    entityName: "ACME CORP",
    indicatorId: "R002",
    indicatorName: "Non-Competitive Awards",
    severity: "high",
    materialityScore: 1000,
    totalDollarValue: 500000,
    signalCount: 1,
    affectedAwardIds: ["A1"],
    signals: [],
    source: "signal_consolidation",
    aiTag: "RULE",
    ...overrides,
  });

  it("identifies entities with 2+ indicators", () => {
    const findings = [
      makeFinding({ entityName: "VENDOR-A", indicatorId: "R001", materialityScore: 500 }),
      makeFinding({ entityName: "VENDOR-A", indicatorId: "R002", materialityScore: 1000 }),
      makeFinding({ entityName: "VENDOR-B", indicatorId: "R003", materialityScore: 200 }),
    ];

    const convergence = computeConvergence(findings);
    expect(convergence).toHaveLength(1);
    expect(convergence[0].entityName).toBe("VENDOR-A");
    expect(convergence[0].indicators).toEqual(["R001", "R002"]);
  });

  it("computes convergence score = indicators.length * sum(materialityScore)", () => {
    const findings = [
      makeFinding({ entityName: "VENDOR-A", indicatorId: "R001", materialityScore: 500 }),
      makeFinding({ entityName: "VENDOR-A", indicatorId: "R002", materialityScore: 1000 }),
    ];

    const convergence = computeConvergence(findings);
    expect(convergence[0].convergenceScore).toBe(2 * (500 + 1000));
  });

  it("sorts by convergence score descending", () => {
    const findings = [
      makeFinding({ entityName: "LOW", indicatorId: "R001", materialityScore: 100 }),
      makeFinding({ entityName: "LOW", indicatorId: "R002", materialityScore: 100 }),
      makeFinding({ entityName: "HIGH", indicatorId: "R001", materialityScore: 5000 }),
      makeFinding({ entityName: "HIGH", indicatorId: "R002", materialityScore: 5000 }),
      makeFinding({ entityName: "HIGH", indicatorId: "R003", materialityScore: 5000 }),
    ];

    const convergence = computeConvergence(findings);
    expect(convergence[0].entityName).toBe("HIGH");
    expect(convergence[0].indicators).toHaveLength(3);
  });

  it("excludes entities with only one indicator", () => {
    const findings = [
      makeFinding({ entityName: "SINGLE", indicatorId: "R001" }),
    ];

    const convergence = computeConvergence(findings);
    expect(convergence).toHaveLength(0);
  });

  it("returns empty for empty findings", () => {
    expect(computeConvergence([])).toEqual([]);
  });

  it("computes total exposure from all findings", () => {
    const findings = [
      makeFinding({ entityName: "VENDOR", indicatorId: "R001", totalDollarValue: 100000 }),
      makeFinding({ entityName: "VENDOR", indicatorId: "R002", totalDollarValue: 200000 }),
    ];

    const convergence = computeConvergence(findings);
    expect(convergence[0].totalExposure).toBe(300000);
  });
});
