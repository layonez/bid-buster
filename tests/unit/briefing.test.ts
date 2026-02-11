/**
 * Tests for executive briefing generation.
 */
import { describe, it, expect } from "vitest";
import { generateBriefing } from "../../src/narrator/briefing.js";
import type { MaterialFinding } from "../../src/shared/types.js";

const makeFinding = (overrides: Partial<MaterialFinding> = {}): MaterialFinding => ({
  id: "F-R002-ACME",
  entityName: "ACME CORPORATION",
  indicatorId: "R002",
  indicatorName: "Non-Competitive Awards",
  severity: "high",
  materialityScore: 1000000,
  totalDollarValue: 5000000,
  signalCount: 3,
  affectedAwardIds: ["A1", "A2", "A3"],
  signals: [],
  fiveCs: {
    condition: "85% of awards were non-competitive",
    criteria: "FAR 6.302 requirements",
    cause: "Possible sole-source dependency",
    effect: "$5M bypassed competition",
    recommendation: "Review J&A documentation",
  },
  source: "signal_consolidation",
  aiTag: "RULE",
  ...overrides,
});

describe("generateBriefing", () => {
  it("produces valid Markdown with title and stats", () => {
    const briefing = generateBriefing({
      findings: [makeFinding()],
      params: {
        agency: "Department of Defense",
        recipient: "MIT",
        periodStart: "2023-01-01",
        periodEnd: "2023-12-31",
        outputDir: "./cases",
        awardTypeCodes: ["A", "B", "C", "D"],
      },
      totalAwards: 54,
      totalSignals: 100,
    });

    expect(briefing).toContain("Department of Defense");
    expect(briefing).toContain("MIT");
    expect(briefing).toContain("54");
    expect(briefing).toContain("100");
    expect(briefing).toContain("Material Findings");
  });

  it("includes top findings with Five C's", () => {
    const briefing = generateBriefing({
      findings: [makeFinding()],
      params: {
        periodStart: "2023-01-01",
        periodEnd: "2023-12-31",
        outputDir: "./cases",
        awardTypeCodes: ["A"],
      },
      totalAwards: 10,
      totalSignals: 5,
    });

    expect(briefing).toContain("85% of awards were non-competitive");
    expect(briefing).toContain("FAR 6.302");
    expect(briefing).toContain("ACME CORPORATION");
  });

  it("includes next steps section", () => {
    const briefing = generateBriefing({
      findings: [makeFinding()],
      params: {
        agency: "DOD",
        periodStart: "2023-01-01",
        periodEnd: "2023-12-31",
        outputDir: "./cases",
        awardTypeCodes: ["A"],
      },
      totalAwards: 10,
      totalSignals: 5,
    });

    expect(briefing).toContain("Next Steps");
    expect(briefing).toContain("--deep");
  });

  it("handles no findings gracefully", () => {
    const briefing = generateBriefing({
      findings: [],
      params: {
        periodStart: "2023-01-01",
        periodEnd: "2023-12-31",
        outputDir: "./cases",
        awardTypeCodes: ["A"],
      },
      totalAwards: 10,
      totalSignals: 0,
    });

    expect(briefing).toContain("No material findings");
  });

  it("includes disclaimer", () => {
    const briefing = generateBriefing({
      findings: [],
      params: {
        periodStart: "2023-01-01",
        periodEnd: "2023-12-31",
        outputDir: "./cases",
        awardTypeCodes: ["A"],
      },
      totalAwards: 10,
      totalSignals: 0,
    });

    expect(briefing).toContain("not proof of wrongdoing");
  });

  it("includes AI tags", () => {
    const briefing = generateBriefing({
      findings: [makeFinding({ aiTag: "AI-DISCOVERED" })],
      params: {
        periodStart: "2023-01-01",
        periodEnd: "2023-12-31",
        outputDir: "./cases",
        awardTypeCodes: ["A"],
      },
      totalAwards: 10,
      totalSignals: 5,
    });

    expect(briefing).toContain("[AI-DISCOVERED]");
  });
});
