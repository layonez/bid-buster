/**
 * Core types shared across all modules.
 */

// ─── Signal Types ────────────────────────────────────────────────────────────

export type Severity = "low" | "medium" | "high";
export type EntityType = "award" | "recipient" | "agency";

export interface Signal {
  indicatorId: string;
  indicatorName: string;
  severity: Severity;
  entityType: EntityType;
  entityId: string;
  entityName: string;
  value: number;
  threshold: number;
  context: string;
  affectedAwards: string[];
}

// ─── Hypothesis Types ────────────────────────────────────────────────────────

export interface Hypothesis {
  id: string;
  signalIds: string[];
  question: string;
  context: string;
  evidenceNeeded: string[];
  severity: Severity;
}

// ─── Evidence Types ──────────────────────────────────────────────────────────

export type EvidenceType = "chart" | "table" | "csv" | "json";

export interface EvidenceArtifact {
  id: string;
  hypothesisId: string;
  type: EvidenceType;
  title: string;
  description: string;
  filePath: string;
  metadata: Record<string, unknown>;
}

// ─── Verification Types ──────────────────────────────────────────────────────

export type VerificationStatus = "supported" | "unsupported" | "partial";

export interface VerificationResult {
  claimId: string;
  claim: string;
  status: VerificationStatus;
  evidenceRefs: string[];
  notes?: string;
}

// ─── Provenance Types ────────────────────────────────────────────────────────

export interface Provenance {
  timestamp: string;
  toolVersion: string;
  gitCommit?: string;
  nodeVersion: string;
  parameters: Record<string, unknown>;
  dataSources: DataSourceInfo[];
  fileHashes: Record<string, string>;
}

export interface DataSourceInfo {
  name: string;
  endpoint?: string;
  snapshotDate: string;
  recordCount: number;
  cacheHit: boolean;
}

// ─── Case Folder Types ───────────────────────────────────────────────────────

export interface CaseFolder {
  path: string;
  caseReport: string;
  evidenceDir: string;
  queriesDir: string;
  analysisDir: string;
  provenancePath: string;
}

// ─── Investigation Context ───────────────────────────────────────────────────

export interface InvestigationParams {
  agency?: string;
  recipient?: string;
  periodStart: string;
  periodEnd: string;
  outputDir: string;
  awardTypeCodes: string[];
}

export interface InvestigationContext {
  params: InvestigationParams;
  startTime: Date;
  signals: Signal[];
  hypotheses: Hypothesis[];
  evidence: EvidenceArtifact[];
  verificationResults: VerificationResult[];
  provenance: Provenance;
}
