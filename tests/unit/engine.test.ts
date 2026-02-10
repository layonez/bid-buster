import { describe, it, expect } from "vitest";
import { SignalEngine } from "../../src/signaler/engine.js";
import { loadConfig } from "../../src/cli/config.js";
import type { NormalizedAward } from "../../src/normalizer/schema.js";

function makeAward(overrides: Partial<NormalizedAward> = {}): NormalizedAward {
  return {
    awardId: "TEST-001",
    internalId: "CONT_AWD_TEST",
    recipientName: "ACME Corp",
    awardingAgency: "Department of Defense",
    awardAmount: 100000,
    awardType: "D",
    startDate: "2023-06-15",
    ...overrides,
  };
}

describe("SignalEngine", () => {
  it("should initialize all enabled indicators", async () => {
    const config = await loadConfig();
    const engine = new SignalEngine();
    engine.initialize(config);

    // Process one award and finalize
    engine.processAwards([
      makeAward({ extentCompeted: "A", numberOfOffersReceived: 1 }),
    ]);
    const result = engine.finalize();

    expect(result.summary.totalIndicatorsRun).toBe(6);
  });

  it("should respect indicator filter", async () => {
    const config = await loadConfig();
    const engine = new SignalEngine();
    engine.initialize(config, ["R001", "R002"]);

    engine.processAwards([
      makeAward({ extentCompeted: "C" }),
    ]);
    const result = engine.finalize();

    expect(result.summary.totalIndicatorsRun).toBe(2);
  });

  it("should sort signals by severity", async () => {
    const config = await loadConfig();
    const engine = new SignalEngine();
    engine.initialize(config, ["R002", "R004"]);

    // Create data that triggers both indicators
    engine.processAwards([
      makeAward({
        awardId: "A-001",
        recipientName: "BigCo",
        extentCompeted: "C",
        awardAmount: 900000,
      }),
      makeAward({
        awardId: "A-002",
        recipientName: "SmallCo",
        extentCompeted: "A",
        awardAmount: 100000,
      }),
    ]);

    const result = engine.finalize();
    expect(result.signals.length).toBeGreaterThan(0);

    // Should be sorted: high → medium → low
    const order = { high: 0, medium: 1, low: 2 };
    for (let i = 1; i < result.signals.length; i++) {
      expect(order[result.signals[i].severity]).toBeGreaterThanOrEqual(
        order[result.signals[i - 1].severity],
      );
    }
  });
});
