import { describe, it, expect, beforeEach } from "vitest";
import type { NormalizedAward } from "../../src/normalizer/schema.js";
import { SingleBidIndicator } from "../../src/signaler/indicators/single-bid.js";
import { NonCompetitiveIndicator } from "../../src/signaler/indicators/non-competitive.js";
import { SplittingIndicator } from "../../src/signaler/indicators/splitting.js";
import { ConcentrationIndicator } from "../../src/signaler/indicators/concentration.js";
import { PriceOutliersIndicator } from "../../src/signaler/indicators/price-outliers.js";

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

describe("R001: SingleBidIndicator", () => {
  let indicator: SingleBidIndicator;

  beforeEach(() => {
    indicator = new SingleBidIndicator();
    indicator.configure({ enabled: true, severityThreshold: 0.2 });
  });

  it("should flag single-bid competitive awards", () => {
    indicator.fold(
      makeAward({
        awardId: "A-001",
        extentCompeted: "A",
        numberOfOffersReceived: 1,
      }),
    );
    indicator.fold(
      makeAward({
        awardId: "A-002",
        extentCompeted: "A",
        numberOfOffersReceived: 3,
      }),
    );

    const signals = indicator.finalize();
    expect(signals).toHaveLength(1);
    expect(signals[0].indicatorId).toBe("R001");
    expect(signals[0].affectedAwards).toContain("A-001");
  });

  it("should skip non-competitive awards", () => {
    indicator.fold(
      makeAward({
        extentCompeted: "C", // Not Competed
        numberOfOffersReceived: 1,
      }),
    );

    const signals = indicator.finalize();
    expect(signals).toHaveLength(0);
  });

  it("should skip awards with null offers", () => {
    indicator.fold(
      makeAward({
        extentCompeted: "A",
        numberOfOffersReceived: null,
      }),
    );

    const signals = indicator.finalize();
    expect(signals).toHaveLength(0);
  });

  it("should report metadata correctly", () => {
    indicator.fold(
      makeAward({
        extentCompeted: "A",
        numberOfOffersReceived: 1,
      }),
    );

    const meta = indicator.getMetadata();
    expect(meta.id).toBe("R001");
    expect(meta.dataCoverage.totalRecords).toBe(1);
    expect(meta.dataCoverage.recordsWithRequiredFields).toBe(1);
  });
});

describe("R002: NonCompetitiveIndicator", () => {
  let indicator: NonCompetitiveIndicator;

  beforeEach(() => {
    indicator = new NonCompetitiveIndicator();
    indicator.configure({ enabled: true });
  });

  it("should flag non-competed awards", () => {
    indicator.fold(makeAward({ awardId: "B-001", extentCompeted: "C" }));
    indicator.fold(makeAward({ awardId: "B-002", extentCompeted: "A" }));
    indicator.fold(makeAward({ awardId: "B-003", extentCompeted: "NDO" }));

    const signals = indicator.finalize();
    expect(signals).toHaveLength(1); // Grouped by recipient
    expect(signals[0].affectedAwards).toHaveLength(2);
    expect(signals[0].affectedAwards).toContain("B-001");
    expect(signals[0].affectedAwards).toContain("B-003");
  });
});

describe("R003: SplittingIndicator", () => {
  let indicator: SplittingIndicator;

  beforeEach(() => {
    indicator = new SplittingIndicator();
    indicator.configure({
      enabled: true,
      thresholds: [250000],
      bandWidthPct: 0.1,
      minClusterSize: 3,
      period: "quarter",
    });
  });

  it("should detect clusters near threshold", () => {
    // 4 awards just below $250K in same quarter
    for (let i = 0; i < 4; i++) {
      indicator.fold(
        makeAward({
          awardId: `S-00${i}`,
          awardAmount: 240000 + i * 1000,
          startDate: "2023-04-15",
        }),
      );
    }

    const signals = indicator.finalize();
    expect(signals).toHaveLength(1);
    expect(signals[0].indicatorId).toBe("R003");
    expect(signals[0].affectedAwards).toHaveLength(4);
  });

  it("should not flag if below minimum cluster size", () => {
    indicator.fold(
      makeAward({ awardAmount: 245000, startDate: "2023-04-15" }),
    );
    indicator.fold(
      makeAward({ awardAmount: 248000, startDate: "2023-04-15" }),
    );

    const signals = indicator.finalize();
    expect(signals).toHaveLength(0);
  });
});

describe("R004: ConcentrationIndicator", () => {
  let indicator: ConcentrationIndicator;

  beforeEach(() => {
    indicator = new ConcentrationIndicator();
    indicator.configure({ enabled: true, vendorShareThreshold: 0.3 });
  });

  it("should flag dominant vendor", () => {
    indicator.fold(
      makeAward({ recipientName: "BigCo", awardAmount: 800000 }),
    );
    indicator.fold(
      makeAward({ recipientName: "SmallCo", awardAmount: 200000 }),
    );

    const signals = indicator.finalize();
    expect(signals).toHaveLength(1);
    expect(signals[0].entityName).toBe("BigCo");
    expect(signals[0].value).toBeCloseTo(80, 0);
  });
});

describe("R006: PriceOutliersIndicator", () => {
  let indicator: PriceOutliersIndicator;

  beforeEach(() => {
    indicator = new PriceOutliersIndicator();
    indicator.configure({
      enabled: true,
      method: "iqr",
      iqrMultiplier: 1.5,
      minGroupSize: 5,
    });
  });

  it("should flag price outliers", () => {
    // 5 normal awards + 1 outlier in same NAICS
    const normalAmounts = [100000, 110000, 105000, 95000, 108000];
    normalAmounts.forEach((amount, i) => {
      indicator.fold(
        makeAward({
          awardId: `P-00${i}`,
          awardAmount: amount,
          naicsCode: "541330",
        }),
      );
    });
    indicator.fold(
      makeAward({
        awardId: "P-OUTLIER",
        awardAmount: 500000,
        naicsCode: "541330",
      }),
    );

    const signals = indicator.finalize();
    expect(signals.length).toBeGreaterThanOrEqual(1);
    expect(signals[0].affectedAwards).toContain("P-OUTLIER");
  });
});
