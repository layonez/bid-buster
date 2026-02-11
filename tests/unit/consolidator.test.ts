/**
 * Tests for signal consolidation and materiality filtering.
 */
import { describe, it, expect } from "vitest";
import { consolidateSignals } from "../../src/signaler/consolidator.js";
import type { Signal } from "../../src/shared/types.js";
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
});
