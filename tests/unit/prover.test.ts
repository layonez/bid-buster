import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { produceEvidence, type ProverInput } from "../../src/prover/analyzer.js";
import type { NormalizedAward } from "../../src/normalizer/schema.js";
import { mkdtemp, readFile, rm } from "node:fs/promises";
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
