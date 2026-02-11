/**
 * File system helpers for case folder management.
 */
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { join } from "node:path";
import { createHash } from "node:crypto";
import type { CaseFolder } from "./types.js";

export interface CaseFolderOptions {
  agency?: string;
  subtierAgency?: string;
  recipient?: string;
  fullEvidence?: boolean;
}

/**
 * Build a descriptive folder name from query params.
 * e.g., "dod-mit-2024_2025-02-11" or "case-2025-02-11"
 */
function buildCaseFolderName(timestamp: string, options?: CaseFolderOptions): string {
  const parts: string[] = [];

  if (options?.agency) {
    // Abbreviate common agencies, otherwise take first word
    const abbrevs: Record<string, string> = {
      "department of defense": "dod",
      "department of energy": "doe",
      "department of state": "dos",
      "department of health and human services": "hhs",
      "department of homeland security": "dhs",
      "national aeronautics and space administration": "nasa",
    };
    const lower = options.agency.toLowerCase();
    parts.push(abbrevs[lower] ?? lower.split(/\s+/)[0].slice(0, 8));
  }

  if (options?.subtierAgency) {
    // Abbreviate common subtier agencies, otherwise take first word
    const subtierAbbrevs: Record<string, string> = {
      "federal emergency management agency": "fema",
    };
    const lower = options.subtierAgency.toLowerCase();
    parts.push(subtierAbbrevs[lower] ?? lower.split(/\s+/)[0].slice(0, 8));
  }

  if (options?.recipient) {
    // Take first word, lowercase, max 12 chars
    parts.push(options.recipient.toLowerCase().split(/\s+/)[0].slice(0, 12));
  }

  const prefix = parts.length > 0 ? parts.join("-") : "case";
  return `${prefix}-${timestamp}`;
}

/**
 * Create the case folder structure for an investigation run.
 */
export async function createCaseFolder(
  baseDir: string,
  timestamp?: string,
  options?: CaseFolderOptions,
): Promise<CaseFolder> {
  const ts = timestamp ?? new Date().toISOString().slice(0, 10);
  const folderName = buildCaseFolderName(ts, options);
  const casePath = join(baseDir, folderName);

  const evidenceDir = join(casePath, "evidence");
  const dataDir = join(casePath, "data");
  const summaryEvidenceDir = join(evidenceDir, "summary");
  const detailEvidenceDir = join(evidenceDir, "detail");
  const chartsDir = join(evidenceDir, "charts");

  const dirs: CaseFolder = {
    path: casePath,
    caseReport: join(casePath, "case.md"),
    evidenceDir,
    queriesDir: join(casePath, "queries"),
    analysisDir: join(casePath, "analysis"),
    provenancePath: join(casePath, "provenance.json"),
    dataDir,
    summaryEvidenceDir,
    detailEvidenceDir,
    chartsDir,
  };

  await mkdir(summaryEvidenceDir, { recursive: true });
  await mkdir(detailEvidenceDir, { recursive: true });
  await mkdir(chartsDir, { recursive: true });
  await mkdir(dirs.queriesDir, { recursive: true });
  await mkdir(dirs.analysisDir, { recursive: true });
  await mkdir(dataDir, { recursive: true });

  return dirs;
}

/**
 * Compute SHA-256 hash of content for cache keying and provenance.
 */
export function sha256(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

/**
 * Write JSON to a file with pretty formatting.
 */
export async function writeJson(
  filePath: string,
  data: unknown,
): Promise<void> {
  await writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
}

/**
 * Read and parse a JSON file.
 */
export async function readJson<T = unknown>(filePath: string): Promise<T> {
  const content = await readFile(filePath, "utf-8");
  return JSON.parse(content) as T;
}
