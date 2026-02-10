import { describe, it, expect } from "vitest";
import { generateHypothesesFromTemplates } from "../../src/hypothesis/templates.js";
import type { Signal } from "../../src/shared/types.js";

function makeSignal(overrides: Partial<Signal> = {}): Signal {
  return {
    indicatorId: "R002",
    indicatorName: "Non-Competitive Awards",
    severity: "medium",
    entityType: "recipient",
    entityId: "ACME-Corp",
    entityName: "ACME Corp",
    value: 75,
    threshold: 50,
    context: "75% of awards were non-competitive",
    affectedAwards: ["A-001", "A-002"],
    ...overrides,
  };
}

describe("Hypothesis Templates", () => {
  it("should generate hypotheses for each signal", () => {
    const signals: Signal[] = [
      makeSignal({ indicatorId: "R002" }),
      makeSignal({ indicatorId: "R004", entityId: "BigCo" }),
    ];

    const hypotheses = generateHypothesesFromTemplates(signals);

    expect(hypotheses).toHaveLength(2);
    expect(hypotheses[0].question).toContain("non-competitive");
    expect(hypotheses[1].question).toContain("concentration");
  });

  it("should use non-accusatory language", () => {
    const hypotheses = generateHypothesesFromTemplates([makeSignal()]);

    // Should NOT contain accusatory words
    const report = JSON.stringify(hypotheses).toLowerCase();
    expect(report).not.toContain("corrupt");
    expect(report).not.toContain("fraud");
    expect(report).not.toContain("guilty");
    // Should contain hedging language
    expect(report).toContain("may");
  });

  it("should deduplicate by hypothesis ID", () => {
    const signals = [makeSignal(), makeSignal()]; // Same signal twice
    const hypotheses = generateHypothesesFromTemplates(signals);
    expect(hypotheses).toHaveLength(1);
  });

  it("should include evidence needed", () => {
    const hypotheses = generateHypothesesFromTemplates([makeSignal()]);
    expect(hypotheses[0].evidenceNeeded.length).toBeGreaterThan(0);
  });
});
