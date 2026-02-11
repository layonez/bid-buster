/**
 * SAM.gov Entity Management API v3 client.
 * Provides entity verification and exclusion lookups.
 * Gracefully degrades when API key is not configured.
 */
import pRetry from "p-retry";
import pThrottle from "p-throttle";
import { z } from "zod";
import type pino from "pino";
import { ResponseCache } from "../collector/cache.js";
import type {
  EntityVerification,
  ExclusionRecord,
  EntityVerificationResult,
  ExclusionCheckResult,
  EnrichmentProvenance,
} from "./types.js";

// ─── Zod Schemas for API response validation ────────────────────────────────

const SamEntitySchema = z.object({
  ueiSAM: z.string(),
  cageCode: z.string().nullish(),
  legalBusinessName: z.string(),
  dbaName: z.string().nullish(),
  entityTypeDesc: z.string().default("Unknown"),
  entityStructureDesc: z.string().nullish(),
  registrationStatus: z.string().default("Unknown"),
  registrationDate: z.string().nullish(),
  registrationExpirationDate: z.string().nullish(),
  exclusionStatusFlag: z.string().nullish(),
  physicalAddress: z
    .object({
      city: z.string().nullish(),
      stateOrProvinceCode: z.string().nullish(),
      countryCode: z.string().nullish(),
    })
    .nullish(),
  businessTypes: z.array(z.string()).nullish(),
  naicsCodeList: z
    .array(z.object({ naicsCode: z.string() }))
    .nullish(),
  parentEntity: z
    .object({
      ueiSAM: z.string().nullish(),
      legalBusinessName: z.string().nullish(),
    })
    .nullish(),
  congressionalDistrict: z.string().nullish(),
});

const SamEntityResponseSchema = z.object({
  totalRecords: z.number(),
  entityData: z.array(SamEntitySchema).default([]),
});

const SamExclusionSchema = z.object({
  classificationType: z.string().default("Unknown"),
  exclusionType: z.string().default("Unknown"),
  excludingAgencyCode: z.string().default("Unknown"),
  activateDate: z.string().default("Unknown"),
  terminationDate: z.string().nullish(),
  name: z.string().default("Unknown"),
  ueiSAM: z.string().nullish(),
  cageCode: z.string().nullish(),
  description: z.string().nullish(),
});

const SamExclusionResponseSchema = z.object({
  totalRecords: z.number(),
  excludedEntityList: z.array(SamExclusionSchema).default([]),
});

// ─── Client Options ─────────────────────────────────────────────────────────

export interface SamGovClientOptions {
  baseUrl: string;
  exclusionsUrl: string;
  requestsPerSecond: number;
  maxRetries: number;
  cacheDirectory: string;
  cacheEnabled: boolean;
  logger: pino.Logger;
}

// ─── Client ─────────────────────────────────────────────────────────────────

export class SamGovClient {
  private cache: ResponseCache;
  private throttledFetch: typeof fetch;
  private apiKey: string | undefined;

  constructor(private options: SamGovClientOptions) {
    this.cache = new ResponseCache(options.cacheDirectory, options.cacheEnabled);
    this.apiKey = process.env.SAM_GOV_API_KEY;

    const throttle = pThrottle({
      limit: options.requestsPerSecond,
      interval: 1000,
    });
    this.throttledFetch = throttle((...args: Parameters<typeof fetch>) =>
      fetch(...args),
    ) as unknown as typeof fetch;
  }

  async initialize(): Promise<void> {
    await this.cache.initialize();
  }

  private makeProvenance(endpoint: string, cacheHit: boolean): EnrichmentProvenance {
    return {
      source: "sam_gov",
      endpoint,
      timestamp: new Date().toISOString(),
      cacheHit,
      apiKeyUsed: !!this.apiKey,
    };
  }

  /**
   * Search for an entity by name.
   * Returns null if API key is not configured.
   */
  async searchEntity(name: string): Promise<EntityVerificationResult | null> {
    if (!this.apiKey) {
      this.options.logger.warn("SAM_GOV_API_KEY not set, skipping entity search");
      return null;
    }

    const endpoint = `${this.options.baseUrl}?api_key=${this.apiKey}&legalBusinessName=${encodeURIComponent(name)}&registrationStatus=A`;
    const cacheKey = `sam:entity:search:${name}`;

    const cached = await this.cache.get<EntityVerification>(cacheKey);
    if (cached) {
      return {
        data: cached,
        provenance: this.makeProvenance(this.options.baseUrl, true),
      };
    }

    try {
      const raw = await this.fetchWithRetry(endpoint);
      const parsed = SamEntityResponseSchema.parse(raw);

      if (parsed.totalRecords === 0 || parsed.entityData.length === 0) {
        return {
          data: null,
          provenance: this.makeProvenance(this.options.baseUrl, false),
        };
      }

      const entity = this.mapEntity(parsed.entityData[0]);
      await this.cache.set(cacheKey, entity);

      return {
        data: entity,
        provenance: this.makeProvenance(this.options.baseUrl, false),
      };
    } catch (err) {
      this.options.logger.error(
        { error: (err as Error).message, name },
        "SAM.gov entity search failed",
      );
      return {
        data: null,
        provenance: this.makeProvenance(this.options.baseUrl, false),
        errors: [(err as Error).message],
      };
    }
  }

  /**
   * Look up an entity by UEI (Unique Entity Identifier).
   * Returns null if API key is not configured.
   */
  async lookupByUei(uei: string): Promise<EntityVerificationResult | null> {
    if (!this.apiKey) {
      this.options.logger.warn("SAM_GOV_API_KEY not set, skipping UEI lookup");
      return null;
    }

    const endpoint = `${this.options.baseUrl}?api_key=${this.apiKey}&ueiSAM=${encodeURIComponent(uei)}`;
    const cacheKey = `sam:entity:uei:${uei}`;

    const cached = await this.cache.get<EntityVerification>(cacheKey);
    if (cached) {
      return {
        data: cached,
        provenance: this.makeProvenance(this.options.baseUrl, true),
      };
    }

    try {
      const raw = await this.fetchWithRetry(endpoint);
      const parsed = SamEntityResponseSchema.parse(raw);

      if (parsed.totalRecords === 0 || parsed.entityData.length === 0) {
        return {
          data: null,
          provenance: this.makeProvenance(this.options.baseUrl, false),
        };
      }

      const entity = this.mapEntity(parsed.entityData[0]);
      await this.cache.set(cacheKey, entity);

      return {
        data: entity,
        provenance: this.makeProvenance(this.options.baseUrl, false),
      };
    } catch (err) {
      this.options.logger.error(
        { error: (err as Error).message, uei },
        "SAM.gov UEI lookup failed",
      );
      return {
        data: null,
        provenance: this.makeProvenance(this.options.baseUrl, false),
        errors: [(err as Error).message],
      };
    }
  }

  /**
   * Check exclusion records for an entity name.
   * Returns null if API key is not configured.
   */
  async checkExclusions(name: string): Promise<ExclusionCheckResult | null> {
    if (!this.apiKey) {
      this.options.logger.warn("SAM_GOV_API_KEY not set, skipping exclusion check");
      return null;
    }

    const endpoint = `${this.options.exclusionsUrl}?api_key=${this.apiKey}&q=${encodeURIComponent(name)}`;
    const cacheKey = `sam:exclusions:${name}`;

    const cached = await this.cache.get<ExclusionRecord[]>(cacheKey);
    if (cached) {
      return {
        data: cached,
        provenance: this.makeProvenance(this.options.exclusionsUrl, true),
      };
    }

    try {
      const raw = await this.fetchWithRetry(endpoint);
      const parsed = SamExclusionResponseSchema.parse(raw);

      const exclusions: ExclusionRecord[] = parsed.excludedEntityList.map((e) => ({
        classificationType: e.classificationType,
        exclusionType: e.exclusionType,
        excludingAgency: e.excludingAgencyCode,
        activationDate: e.activateDate,
        terminationDate: e.terminationDate ?? undefined,
        name: e.name,
        ueiSAM: e.ueiSAM ?? undefined,
        cageCode: e.cageCode ?? undefined,
        description: e.description ?? undefined,
      }));

      await this.cache.set(cacheKey, exclusions);

      return {
        data: exclusions,
        provenance: this.makeProvenance(this.options.exclusionsUrl, false),
      };
    } catch (err) {
      this.options.logger.error(
        { error: (err as Error).message, name },
        "SAM.gov exclusion check failed",
      );
      return {
        data: [],
        provenance: this.makeProvenance(this.options.exclusionsUrl, false),
        errors: [(err as Error).message],
      };
    }
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private mapEntity(raw: z.infer<typeof SamEntitySchema>): EntityVerification {
    return {
      ueiSAM: raw.ueiSAM,
      cageCode: raw.cageCode ?? undefined,
      legalBusinessName: raw.legalBusinessName,
      dbaName: raw.dbaName ?? undefined,
      entityType: raw.entityTypeDesc,
      entityStructure: raw.entityStructureDesc ?? undefined,
      registrationStatus: raw.registrationStatus,
      registrationDate: raw.registrationDate ?? undefined,
      expirationDate: raw.registrationExpirationDate ?? undefined,
      exclusionStatusFlag: raw.exclusionStatusFlag === "Y",
      physicalAddress: raw.physicalAddress
        ? {
            city: raw.physicalAddress.city ?? undefined,
            stateOrProvince: raw.physicalAddress.stateOrProvinceCode ?? undefined,
            country: raw.physicalAddress.countryCode ?? undefined,
          }
        : undefined,
      businessTypes: raw.businessTypes ?? undefined,
      naicsCodes: raw.naicsCodeList?.map((n) => n.naicsCode) ?? undefined,
      parentUei: raw.parentEntity?.ueiSAM ?? undefined,
      parentLegalBusinessName: raw.parentEntity?.legalBusinessName ?? undefined,
      congressionalDistrict: raw.congressionalDistrict ?? undefined,
    };
  }

  private async fetchWithRetry(url: string): Promise<unknown> {
    return pRetry(
      async () => {
        const response = await this.throttledFetch(url, {
          method: "GET",
          headers: { Accept: "application/json" },
        });

        if (response.status === 429) {
          throw new Error("Rate limited (429)");
        }

        if (!response.ok) {
          const text = await response.text().catch(() => "");
          throw new Error(`HTTP ${response.status}: ${text.slice(0, 200)}`);
        }

        return await response.json();
      },
      {
        retries: this.options.maxRetries,
        minTimeout: 1000,
        onFailedAttempt: (error) => {
          this.options.logger.warn(
            { attempt: error.attemptNumber, url: url.replace(/api_key=[^&]+/, "api_key=***") },
            "SAM.gov request failed, retrying...",
          );
        },
      },
    );
  }
}
