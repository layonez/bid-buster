import { describe, it, expect } from "vitest";
import { assembleReport } from "../../src/narrator/report.js";
import type { ReportData } from "../../src/narrator/report.js";

function makeReportData(): ReportData {
  return {
    params: {
      agency: "Department of Defense",
      recipient: "MIT",
      periodStart: "2023-01-01",
      periodEnd: "2023-12-31",
      outputDir: "./cases",
      awardTypeCodes: ["A", "B", "C", "D"],
    },
    signalResult: {
      signals: [
        {
          indicatorId: "R002",
          indicatorName: "Non-Competitive Awards",
          severity: "medium",
          entityType: "recipient",
          entityId: "MIT",
          entityName: "MIT",
          value: 80,
          threshold: 50,
          context: "80% non-competitive",
          affectedAwards: ["A-001"],
        },
      ],
      metadata: [
        {
          id: "R002",
          name: "Non-Competitive Awards",
          description: "test",
          methodology: "test",
          thresholdsUsed: { codesToFlagCount: 4 },
          dataCoverage: { totalRecords: 50, recordsWithRequiredFields: 50, coveragePercent: 100 },
        },
      ],
      summary: {
        totalIndicatorsRun: 6,
        totalSignals: 1,
        signalsBySeverity: { medium: 1 },
        signalsByIndicator: { R002: 1 },
      },
    },
    hypotheses: [
      {
        id: "H-R002-MIT",
        signalIds: ["R002"],
        question: "Does the pattern warrant review?",
        context: "Test context",
        evidenceNeeded: ["Evidence A"],
        severity: "medium",
      },
    ],
    evidence: [],
    provenance: {
      timestamp: "2026-02-10T00:00:00Z",
      toolVersion: "0.1.0",
      nodeVersion: "v20.0.0",
      parameters: {},
      dataSources: [],
      fileHashes: {},
    },
  };
}

describe("Report Assembly", () => {
  it("should include disclaimer", () => {
    const report = assembleReport(makeReportData());
    expect(report).toContain("Disclaimer");
    expect(report).toContain("not proof of wrongdoing");
  });

  it("should include signal table", () => {
    const report = assembleReport(makeReportData());
    expect(report).toContain("Non-Competitive Awards");
    expect(report).toContain("MEDIUM");
  });

  it("should include hypothesis section", () => {
    const report = assembleReport(makeReportData());
    expect(report).toContain("Does the pattern warrant review?");
  });

  it("should include provenance", () => {
    const report = assembleReport(makeReportData());
    expect(report).toContain("0.1.0");
    expect(report).toContain("Provenance");
  });

  it("should include methodology references", () => {
    const report = assembleReport(makeReportData());
    expect(report).toContain("Open Contracting Partnership");
    expect(report).toContain("OECD");
  });

  it("should include evidence artifact links when provided", () => {
    const data = makeReportData();
    data.evidence = [
      {
        id: "E-R002-MIT-breakdown",
        hypothesisId: "H-R002-MIT",
        type: "csv",
        title: "Competition Breakdown",
        description: "Breakdown of awards by competition type",
        filePath: "evidence/H-R002-MIT-competition-breakdown.csv",
        metadata: {},
      },
    ];
    const report = assembleReport(data);
    expect(report).toContain("Supporting evidence:");
    expect(report).toContain("Competition Breakdown");
    expect(report).toContain("evidence/H-R002-MIT-competition-breakdown.csv");
  });

  it("should label evidence needed as 'for further review'", () => {
    const report = assembleReport(makeReportData());
    expect(report).toContain("Evidence needed for further review:");
  });
});
