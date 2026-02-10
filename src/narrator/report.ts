/**
 * Report narrator stub.
 * Assembles the final case.md report with footnotes and disclaimers.
 * Will be implemented in Phase 5.
 */
import type {
  Signal,
  Hypothesis,
  EvidenceArtifact,
  VerificationResult,
  InvestigationParams,
} from "../shared/types.js";

export interface ReportData {
  params: InvestigationParams;
  signals: Signal[];
  hypotheses: Hypothesis[];
  evidence: EvidenceArtifact[];
  verificationResults: VerificationResult[];
  dataQualityNotes: string[];
}

export function assembleReport(_data: ReportData): string {
  // TODO: Phase 5 - implement case.md generation
  return "# Investigation Case File\n\nReport generation not yet implemented.";
}
