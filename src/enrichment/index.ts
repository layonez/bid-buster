/**
 * Enrichment module barrel export.
 * Provides multi-source data enrichment clients for the investigative agent.
 */

// Types
export type {
  EntityVerification,
  ExclusionRecord,
  SanctionsScreenResult,
  SubAwardData,
  EnrichmentSource,
  EnrichmentProvenance,
  EnrichmentResult,
  EntityVerificationResult,
  ExclusionCheckResult,
  SanctionsScreeningResult,
  SubAwardResult,
} from "./types.js";

// Clients
export { SamGovClient } from "./sam-gov.js";
export type { SamGovClientOptions } from "./sam-gov.js";

export { SubAwardsClient } from "./subawards.js";
export type { SubAwardsClientOptions } from "./subawards.js";

export { OpenSanctionsClient } from "./open-sanctions.js";
export type { OpenSanctionsClientOptions } from "./open-sanctions.js";
