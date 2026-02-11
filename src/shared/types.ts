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

// ─── Query Context (propagated downstream for filter-aware analysis) ─────────

export interface QueryContext {
  recipientFilter?: string;
  agencyFilter?: string;
  periodStart: string;
  periodEnd: string;
  isRecipientFiltered: boolean;
  isAgencyFiltered: boolean;
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

// ─── Chart Types ────────────────────────────────────────────────────────────

export type ChartType =
  | "award-distribution"
  | "vendor-concentration"
  | "competition-breakdown"
  | "price-outlier"
  | "modification-timeline"
  | "threshold-clustering";

export interface ChartArtifact {
  id: string;
  type: ChartType;
  title: string;
  description: string;
  filePath: string;
  hypothesisIds: string[];
  indicatorIds: string[];
  spec: Record<string, unknown>;
}

// ─── Investigator Types ─────────────────────────────────────────────────────

export interface ToolCallRecord {
  toolName: string;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  durationMs: number;
  cacheHit: boolean;
  timestamp: string;
  error?: string;
}

export interface CrossReference {
  sourceA: string;
  sourceB: string;
  finding: string;
  impact: "confirms" | "refutes" | "contextualizes";
  affectedHypotheses: string[];
}

export interface EnrichedHypothesis {
  hypothesisId: string;
  originalQuestion: string;
  enrichedContext: string;
  innocentExplanations: string[];
  additionalEvidence: string[];
  confidenceAdjustment: "increased" | "decreased" | "unchanged";
  reasoning: string;
}

export interface InvestigationFindings {
  enrichedHypotheses: EnrichedHypothesis[];
  crossReferences: CrossReference[];
  toolCallLog: ToolCallRecord[];
  iterations: number;
  estimatedCostUsd: number;
  summary: string;
}

// ─── Dashboard Types ────────────────────────────────────────────────────────

export interface DashboardData {
  title: string;
  generatedAt: string;
  params: InvestigationParams;
  awards: Record<string, unknown>[];
  signals: Signal[];
  hypotheses: Hypothesis[];
  evidence: EvidenceArtifact[];
  charts: ChartArtifact[];
  provenance: Provenance;
  investigationFindings?: InvestigationFindings;
}
