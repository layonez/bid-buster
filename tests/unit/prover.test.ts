import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { produceEvidence, type ProverInput } from "../../src/prover/analyzer.js";
import type { NormalizedAward } from "../../src/normalizer/schema.js";
import type { MaterialFinding } from "../../src/shared/types.js";
import { mkdtemp, readFile, rm, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

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

function makeInput(
  awards: NormalizedAward[],
  evidenceDir: string,
): ProverInput {
  return {
    hypotheses: [
      {
        id: "H-R002-ACME",
        signalIds: ["R002"],
        question: "Does the pattern warrant review?",
        context: "80% non-competitive",
        evidenceNeeded: ["Evidence A"],
        severity: "medium",
      },
      {
        id: "H-R004-ACME",
        signalIds: ["R004"],
        question: "Is concentration warranted?",
        context: "100% concentration",
        evidenceNeeded: ["Evidence B"],
        severity: "high",
      },
    ],
    signalResult: {
      signals: [
        {
          indicatorId: "R002",
          indicatorName: "Non-Competitive Awards",
          severity: "medium",
          entityType: "recipient",
          entityId: "ACME",
          entityName: "ACME Corp",
          value: 80,
          threshold: 50,
          context: "80% non-competitive",
          affectedAwards: ["CONT0001"],
        },
        {
          indicatorId: "R004",
          indicatorName: "Vendor Concentration",
          severity: "high",
          entityType: "recipient",
          entityId: "ACME",
          entityName: "ACME Corp",
          value: 100,
          threshold: 30,
          context: "100% vendor concentration",
          affectedAwards: ["CONT0001"],
        },
      ],
      metadata: [
        {
          id: "R002",
          name: "Non-Competitive Awards",
          description: "test",
          methodology: "test",
          thresholdsUsed: { codesToFlagCount: 4 },
          dataCoverage: { totalRecords: 5, recordsWithRequiredFields: 5, coveragePercent: 100 },
        },
        {
          id: "R004",
          name: "Vendor Concentration",
          description: "test",
          methodology: "test",
          thresholdsUsed: { vendorShareThreshold: 0.3 },
          dataCoverage: { totalRecords: 5, recordsWithRequiredFields: 5, coveragePercent: 100 },
        },
      ],
      summary: {
        totalIndicatorsRun: 2,
        totalSignals: 2,
        signalsBySeverity: { medium: 1, high: 1 },
        signalsByIndicator: { R002: 1, R004: 1 },
      },
    },
    awards,
    transactions: new Map(),
    evidenceDir,
  };
}

describe("Prover Agent", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "prover-test-"));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it("should produce evidence artifacts for each hypothesis", async () => {
    const awards = [
      makeAward({ extentCompeted: "C" }),
      makeAward({ awardId: "CONT0002", internalId: "int-002", extentCompeted: "A" }),
    ];

    const input = makeInput(awards, tempDir);
    const artifacts = await produceEvidence(input);

    // Should have: R002 (2 files) + R004 (1 file) + master summary (1 file) = 4
    expect(artifacts.length).toBeGreaterThanOrEqual(3);

    // All artifacts should have required fields
    for (const artifact of artifacts) {
      expect(artifact.id).toBeTruthy();
      expect(artifact.type).toBe("csv");
      expect(artifact.filePath).toContain("evidence/");
      expect(artifact.title).toBeTruthy();
    }
  });

  it("should produce valid CSV files", async () => {
    const awards = [
      makeAward({ extentCompeted: "C", recipientName: "ACME Corp" }),
      makeAward({ awardId: "CONT0002", internalId: "int-002", extentCompeted: "A" }),
    ];

    const input = makeInput(awards, tempDir);
    await produceEvidence(input);

    // Check master awards summary CSV exists and is valid
    const summaryContent = await readFile(join(tempDir, "awards-summary.csv"), "utf-8");
    const lines = summaryContent.split("\n");
    expect(lines.length).toBeGreaterThan(1); // Header + at least one data row
    expect(lines[0]).toContain("Award ID");
    expect(lines[0]).toContain("Recipient");
  });

  it("should always produce a master awards summary", async () => {
    const input = makeInput([makeAward()], tempDir);
    const artifacts = await produceEvidence(input);

    const summary = artifacts.find((a) => a.id === "E-SUMMARY");
    expect(summary).toBeDefined();
    expect(summary!.filePath).toBe("evidence/awards-summary.csv");
  });

  it("should handle CSV escaping for commas and quotes", async () => {
    const awards = [
      makeAward({
        recipientName: 'ACME, Inc. "The Best"',
        description: "Some description, with commas",
      }),
    ];

    const input = makeInput(awards, tempDir);
    await produceEvidence(input);

    const content = await readFile(join(tempDir, "awards-summary.csv"), "utf-8");
    // Should properly escape the values
    expect(content).toContain('"ACME');
  });

  it("should skip H-EXECUTIVE hypothesis", async () => {
    const input = makeInput([makeAward()], tempDir);
    input.hypotheses.unshift({
      id: "H-EXECUTIVE",
      signalIds: ["R002"],
      question: "What do signals suggest?",
      context: "AI summary",
      evidenceNeeded: [],
      severity: "medium",
    });

    const artifacts = await produceEvidence(input);
    const execEvidence = artifacts.filter((a) => a.hypothesisId === "H-EXECUTIVE");
    expect(execEvidence).toHaveLength(0);
  });
});

describe("Entity-scoped evidence", () => {
  let tempDir: string;
  let summaryDir: string;
  let detailDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "prover-scoped-"));
    summaryDir = join(tempDir, "summary");
    detailDir = join(tempDir, "detail");
    await mkdir(summaryDir, { recursive: true });
    await mkdir(detailDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  function makeScopedInput(
    awards: NormalizedAward[],
    findings: MaterialFinding[],
    fullEvidence = false,
  ): ProverInput {
    return {
      ...makeInput(awards, tempDir),
      findings,
      fullEvidence,
      summaryEvidenceDir: summaryDir,
      detailEvidenceDir: detailDir,
    };
  }

  it("should scope evidence CSVs to finding's affected awards", async () => {
    const awards = [
      makeAward({ awardId: "CONT0001", recipientName: "ACME Corp", extentCompeted: "C" }),
      makeAward({ awardId: "CONT0002", internalId: "int-002", recipientName: "Other Inc", extentCompeted: "A" }),
      makeAward({ awardId: "CONT0003", internalId: "int-003", recipientName: "Another LLC", extentCompeted: "C" }),
    ];

    const findings: MaterialFinding[] = [
      {
        id: "F-R002-ACME",
        entityName: "ACME Corp",
        indicatorId: "R002",
        indicatorName: "Non-Competitive Awards",
        severity: "medium",
        materialityScore: 100,
        totalDollarValue: 500_000,
        signalCount: 1,
        affectedAwardIds: ["CONT0001"],
        signals: [{
          indicatorId: "R002",
          indicatorName: "Non-Competitive Awards",
          severity: "medium",
          entityType: "recipient",
          entityId: "ACME",
          entityName: "ACME Corp",
          value: 80,
          threshold: 50,
          context: "80% non-competitive",
          affectedAwards: ["CONT0001"],
        }],
        source: "signal_consolidation",
      },
    ];

    const input = makeScopedInput(awards, findings);
    const artifacts = await produceEvidence(input);

    // Should produce scoped evidence in summary dir
    expect(artifacts.length).toBeGreaterThan(0);
    expect(artifacts.every((a) => a.filePath.includes("evidence/summary/"))).toBe(true);

    // The competition breakdown CSV should be scoped to 1 award, not all 3
    const breakdownArtifact = artifacts.find((a) => a.filePath.includes("competition-breakdown"));
    expect(breakdownArtifact).toBeDefined();
    expect(breakdownArtifact!.metadata.totalAwards).toBe(1);

    // Read the CSV and verify row count
    const csvFile = breakdownArtifact!.filePath.replace("evidence/summary/", "");
    const content = await readFile(join(summaryDir, csvFile), "utf-8");
    const dataRows = content.split("\n").filter((l) => l.length > 0).length - 1; // subtract header
    expect(dataRows).toBe(1); // Only 1 competition code from 1 award
  });

  it("should not produce master awards-summary in default mode", async () => {
    const awards = [makeAward()];
    const findings: MaterialFinding[] = [
      {
        id: "F-R002-ACME",
        entityName: "ACME Corp",
        indicatorId: "R002",
        indicatorName: "Non-Competitive Awards",
        severity: "medium",
        materialityScore: 100,
        totalDollarValue: 500_000,
        signalCount: 1,
        affectedAwardIds: ["CONT0001"],
        signals: [{
          indicatorId: "R002",
          indicatorName: "Non-Competitive Awards",
          severity: "medium",
          entityType: "recipient",
          entityId: "ACME",
          entityName: "ACME Corp",
          value: 80,
          threshold: 50,
          context: "80% non-competitive",
          affectedAwards: ["CONT0001"],
        }],
        source: "signal_consolidation",
      },
    ];

    const input = makeScopedInput(awards, findings, false);
    const artifacts = await produceEvidence(input);

    // No master summary in default (non-fullEvidence) mode
    const summary = artifacts.find((a) => a.id === "E-SUMMARY");
    expect(summary).toBeUndefined();
  });

  it("should produce detail evidence when fullEvidence is true", async () => {
    const awards = [
      makeAward({ awardId: "CONT0001", extentCompeted: "C" }),
      makeAward({ awardId: "CONT0002", internalId: "int-002", extentCompeted: "A" }),
    ];

    const findings: MaterialFinding[] = [
      {
        id: "F-R002-ACME",
        entityName: "ACME Corp",
        indicatorId: "R002",
        indicatorName: "Non-Competitive Awards",
        severity: "medium",
        materialityScore: 100,
        totalDollarValue: 500_000,
        signalCount: 1,
        affectedAwardIds: ["CONT0001"],
        signals: [{
          indicatorId: "R002",
          indicatorName: "Non-Competitive Awards",
          severity: "medium",
          entityType: "recipient",
          entityId: "ACME",
          entityName: "ACME Corp",
          value: 80,
          threshold: 50,
          context: "80% non-competitive",
          affectedAwards: ["CONT0001"],
        }],
        source: "signal_consolidation",
      },
    ];

    const input = makeScopedInput(awards, findings, true);
    const artifacts = await produceEvidence(input);

    // Should have both summary and detail artifacts
    const summaryArtifacts = artifacts.filter((a) => a.filePath.includes("evidence/summary/"));
    const detailArtifacts = artifacts.filter((a) => a.filePath.includes("evidence/detail/"));
    expect(summaryArtifacts.length).toBeGreaterThan(0);
    expect(detailArtifacts.length).toBeGreaterThan(0);

    // Detail should include master awards summary
    const masterSummary = detailArtifacts.find((a) => a.id === "E-SUMMARY");
    expect(masterSummary).toBeDefined();
    expect(masterSummary!.filePath).toBe("evidence/detail/awards-summary.csv");

    // Detail evidence should be unfiltered (all awards)
    const detailBreakdown = detailArtifacts.find((a) => a.filePath.includes("competition-breakdown"));
    expect(detailBreakdown).toBeDefined();
    expect(detailBreakdown!.metadata.totalAwards).toBe(2); // Both awards
  });

  it("should use full dataset for R004 vendor concentration", async () => {
    const awards = [
      makeAward({ awardId: "CONT0001", recipientName: "ACME Corp", awardAmount: 300_000 }),
      makeAward({ awardId: "CONT0002", internalId: "int-002", recipientName: "Other Inc", awardAmount: 200_000 }),
    ];

    const findings: MaterialFinding[] = [
      {
        id: "F-R004-ACME",
        entityName: "ACME Corp",
        indicatorId: "R004",
        indicatorName: "Vendor Concentration",
        severity: "high",
        materialityScore: 200,
        totalDollarValue: 300_000,
        signalCount: 1,
        affectedAwardIds: ["CONT0001"],
        signals: [{
          indicatorId: "R004",
          indicatorName: "Vendor Concentration",
          severity: "high",
          entityType: "recipient",
          entityId: "ACME",
          entityName: "ACME Corp",
          value: 60,
          threshold: 30,
          context: "60% vendor concentration",
          affectedAwards: ["CONT0001"],
        }],
        source: "signal_consolidation",
      },
    ];

    const input = makeScopedInput(awards, findings);
    const artifacts = await produceEvidence(input);

    // R004 should use all awards for market share context
    const concentrationArtifact = artifacts.find((a) => a.filePath.includes("vendor-concentration"));
    expect(concentrationArtifact).toBeDefined();
    expect(concentrationArtifact!.metadata.vendorCount).toBe(2); // Both vendors, not just ACME
  });
});
