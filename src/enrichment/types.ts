/**
 * Types for multi-source enrichment data.
 * SAM.gov entity verification, OpenSanctions screening, and USAspending sub-awards.
 */

// ─── SAM.gov Entity Verification ────────────────────────────────────────────

export interface EntityVerification {
  ueiSAM: string;
  cageCode?: string;
  legalBusinessName: string;
  dbaName?: string;
  entityType: string;
  entityStructure?: string;
  registrationStatus: string;
  registrationDate?: string;
  expirationDate?: string;
  exclusionStatusFlag: boolean;
  physicalAddress?: {
    city?: string;
    stateOrProvince?: string;
    country?: string;
  };
  businessTypes?: string[];
  naicsCodes?: string[];
  parentUei?: string;
  parentLegalBusinessName?: string;
  congressionalDistrict?: string;
}

// ─── SAM.gov Exclusion Record ───────────────────────────────────────────────

export interface ExclusionRecord {
  classificationType: string;
  exclusionType: string;
  excludingAgency: string;
  activationDate: string;
  terminationDate?: string;
  name: string;
  ueiSAM?: string;
  cageCode?: string;
  description?: string;
}

// ─── OpenSanctions Screening ────────────────────────────────────────────────

export interface SanctionsScreenResult {
  query: string;
  matchFound: boolean;
  score: number;
  matchedName?: string;
  datasets: string[];
  topics: string[];
  entityType?: string;
  countries?: string[];
  referenceUrl?: string;
}

// ─── Sub-Award Data ─────────────────────────────────────────────────────────

export interface SubAwardData {
  subawardNumber: string;
  amount: number;
  actionDate: string;
  recipientName: string;
  recipientUei?: string;
  description?: string;
  primeAwardId: string;
  primeRecipientName?: string;
  placeOfPerformance?: {
    city?: string;
    state?: string;
    country?: string;
  };
}

// ─── Enrichment Result Wrapper ──────────────────────────────────────────────

export type EnrichmentSource =
  | "sam_gov"
  | "open_sanctions"
  | "usaspending_subawards";

export interface EnrichmentProvenance {
  source: EnrichmentSource;
  endpoint: string;
  timestamp: string;
  cacheHit: boolean;
  apiKeyUsed: boolean;
}

export interface EnrichmentResult<T = unknown> {
  data: T;
  provenance: EnrichmentProvenance;
  errors?: string[];
}

// ─── Typed Enrichment Results ───────────────────────────────────────────────

export type EntityVerificationResult = EnrichmentResult<EntityVerification | null>;
export type ExclusionCheckResult = EnrichmentResult<ExclusionRecord[]>;
export type SanctionsScreeningResult = EnrichmentResult<SanctionsScreenResult>;
export type SubAwardResult = EnrichmentResult<SubAwardData[]>;
