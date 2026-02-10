/**
 * Provenance metadata generation for reproducibility.
 */
import { execSync } from "node:child_process";
import type { Provenance, DataSourceInfo } from "./types.js";

/**
 * Generate provenance metadata for the current run.
 */
export function createProvenance(
  parameters: Record<string, unknown>,
  dataSources: DataSourceInfo[] = [],
  fileHashes: Record<string, string> = {},
): Provenance {
  return {
    timestamp: new Date().toISOString(),
    toolVersion: "0.1.0",
    gitCommit: getGitCommit(),
    nodeVersion: process.version,
    parameters,
    dataSources,
    fileHashes,
  };
}

function getGitCommit(): string | undefined {
  try {
    return execSync("git rev-parse HEAD", { encoding: "utf-8" }).trim();
  } catch {
    return undefined;
  }
}
