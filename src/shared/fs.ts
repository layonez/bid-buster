/**
 * File system helpers for case folder management.
 */
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { join } from "node:path";
import { createHash } from "node:crypto";
import type { CaseFolder } from "./types.js";

/**
 * Create the case folder structure for an investigation run.
 */
export async function createCaseFolder(
  baseDir: string,
  timestamp?: string,
): Promise<CaseFolder> {
  const ts = timestamp ?? new Date().toISOString().slice(0, 10);
  const casePath = join(baseDir, `case-${ts}`);

  const dirs = {
    path: casePath,
    caseReport: join(casePath, "case.md"),
    evidenceDir: join(casePath, "evidence"),
    queriesDir: join(casePath, "queries"),
    analysisDir: join(casePath, "analysis"),
    provenancePath: join(casePath, "provenance.json"),
  };

  await mkdir(dirs.evidenceDir, { recursive: true });
  await mkdir(dirs.queriesDir, { recursive: true });
  await mkdir(dirs.analysisDir, { recursive: true });

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
