import { describe, it, expect } from "vitest";
import { buildSearchFilters } from "../../src/collector/index.js";

describe("buildSearchFilters", () => {
  const baseParams = {
    periodStart: "2020-01-01",
    periodEnd: "2020-12-31",
    awardTypeCodes: ["A", "B", "C", "D"],
    withDetails: false,
    withTransactions: false,
    pageLimit: 100,
  };

  it("should use toptier tier for --agency", () => {
    const filters = buildSearchFilters({
      ...baseParams,
      agency: "Department of Defense",
    });

    expect(filters.agencies).toEqual([
      { type: "awarding", tier: "toptier", name: "Department of Defense" },
    ]);
  });

  it("should use subtier tier for --subtier-agency", () => {
    const filters = buildSearchFilters({
      ...baseParams,
      subtierAgency: "Federal Emergency Management Agency",
    });

    expect(filters.agencies).toEqual([
      { type: "awarding", tier: "subtier", name: "Federal Emergency Management Agency" },
    ]);
  });

  it("should prefer subtier-agency over agency when both provided", () => {
    const filters = buildSearchFilters({
      ...baseParams,
      agency: "Department of Homeland Security",
      subtierAgency: "Federal Emergency Management Agency",
    });

    expect(filters.agencies).toEqual([
      { type: "awarding", tier: "subtier", name: "Federal Emergency Management Agency" },
    ]);
  });

  it("should omit agencies filter when neither agency nor subtier-agency provided", () => {
    const filters = buildSearchFilters({
      ...baseParams,
      recipient: "ACME Corp",
    });

    expect(filters.agencies).toBeUndefined();
  });

  it("should include recipient filter", () => {
    const filters = buildSearchFilters({
      ...baseParams,
      agency: "Department of Defense",
      recipient: "MIT",
    });

    expect(filters.recipient_search_text).toEqual(["MIT"]);
    expect(filters.agencies).toEqual([
      { type: "awarding", tier: "toptier", name: "Department of Defense" },
    ]);
  });

  it("should include time period", () => {
    const filters = buildSearchFilters(baseParams);

    expect(filters.time_period).toEqual([
      { start_date: "2020-01-01", end_date: "2020-12-31" },
    ]);
  });
});
