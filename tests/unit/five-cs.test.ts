/**
 * Tests for Five C's (GAO Yellow Book) finding structure generation.
 */
import { describe, it, expect } from "vitest";
import { generateFiveCs } from "../../src/hypothesis/five-cs.js";
import type { Signal } from "../../src/shared/types.js";
import type { NormalizedAward } from "../../src/normalizer/schema.js";

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

describe("generateFiveCs", () => {
  it("produces all five fields", () => {
    const signal = makeSignal();
    const awards = [makeAward()];

    const result = generateFiveCs(signal, awards);

    expect(result.condition).toBeDefined();
    expect(result.criteria).toBeDefined();
    expect(result.cause).toBeDefined();
    expect(result.effect).toBeDefined();
    expect(result.recommendation).toBeDefined();
    expect(result.condition.length).toBeGreaterThan(10);
    expect(result.criteria.length).toBeGreaterThan(10);
  });

  it("generates R001 template with entity name", () => {
    const signal = makeSignal({ indicatorId: "R001", indicatorName: "Single-Bid Competition" });
    const result = generateFiveCs(signal, [makeAward()]);
    expect(result.condition).toContain("ACME CORPORATION");
    expect(result.criteria).toContain("FAR");
  });

  it("generates R002 template with non-competitive context", () => {
    const signal = makeSignal({ indicatorId: "R002" });
    const result = generateFiveCs(signal, [makeAward()]);
    expect(result.condition).toContain("non-competitive");
    expect(result.criteria).toContain("FAR 6.302");
    expect(result.recommendation).toContain("SAM.gov");
  });

  it("generates R003 template with threshold value", () => {
    const signal = makeSignal({ indicatorId: "R003", threshold: 250000 });
    const result = generateFiveCs(signal, [makeAward()]);
    expect(result.condition).toContain("250,000");
    expect(result.criteria).toContain("Simplified Acquisition Threshold");
  });

  it("handles unknown indicator gracefully", () => {
    const signal = makeSignal({ indicatorId: "R999" });
    const result = generateFiveCs(signal, [makeAward()]);
    expect(result.condition).toBe(signal.context);
    expect(result.recommendation).toContain("Review");
  });

  it("uses non-accusatory language throughout", () => {
    for (const id of ["R001", "R002", "R003", "R004", "R005", "R006"]) {
      const signal = makeSignal({ indicatorId: id, entityId: "AWARD-001" });
      const result = generateFiveCs(signal, [makeAward()]);

      const allText = Object.values(result).join(" ").toLowerCase();
      expect(allText).not.toContain("corrupt");
      expect(allText).not.toContain("fraud");
      expect(allText).not.toContain("guilty");
      expect(allText).not.toContain("criminal");
    }
  });
});
