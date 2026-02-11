/**
 * USAspending Sub-Awards API client.
 * Fetches sub-award data for prime awards to identify pass-through patterns.
 * No API key required (same as main USAspending API).
 */
import pRetry from "p-retry";
import pThrottle from "p-throttle";
import { z } from "zod";
import type pino from "pino";
import { ResponseCache } from "../collector/cache.js";
import type {
  SubAwardData,
  SubAwardResult,
  EnrichmentProvenance,
} from "./types.js";

// ─── Zod Schemas for API response validation ────────────────────────────────

const SubAwardRecordSchema = z.object({
  subaward_number: z.string().default(""),
  amount: z.number().default(0),
  action_date: z.string().default(""),
  recipient_name: z.string().default("Unknown"),
  recipient_unique_id: z.string().nullish(),
  description: z.string().nullish(),
  prime_award_internal_id: z.string().default(""),
  prime_recipient_name: z.string().nullish(),
  place_of_performance: z
    .object({
      city_name: z.string().nullish(),
      state_code: z.string().nullish(),
      country_code: z.string().nullish(),
    })
    .nullish(),
});

const SubAwardResponseSchema = z.object({
  results: z.array(SubAwardRecordSchema).default([]),
  page_metadata: z.object({
    page: z.number(),
    hasNext: z.boolean(),
    total: z.number().optional(),
  }),
});

// ─── Client Options ─────────────────────────────────────────────────────────

export interface SubAwardsClientOptions {
  baseUrl: string;
  requestsPerSecond: number;
  maxRetries: number;
  maxPerAward: number;
  cacheDirectory: string;
  cacheEnabled: boolean;
  logger: pino.Logger;
}

// ─── Client ─────────────────────────────────────────────────────────────────

export class SubAwardsClient {
  private cache: ResponseCache;
  private throttledFetch: typeof fetch;

  constructor(private options: SubAwardsClientOptions) {
    this.cache = new ResponseCache(options.cacheDirectory, options.cacheEnabled);

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

  private makeProvenance(cacheHit: boolean): EnrichmentProvenance {
    return {
      source: "usaspending_subawards",
      endpoint: `${this.options.baseUrl}/subawards/`,
      timestamp: new Date().toISOString(),
      cacheHit,
      apiKeyUsed: false,
    };
  }

  /**
   * Fetch sub-awards for a given prime award ID.
   * Paginates automatically up to maxPerAward records.
   */
  async fetchSubAwards(awardId: string): Promise<SubAwardResult> {
    const cacheKey = `subawards:${awardId}`;

    const cached = await this.cache.get<SubAwardData[]>(cacheKey);
    if (cached) {
      return {
        data: cached,
        provenance: this.makeProvenance(true),
      };
    }

    try {
      const allSubAwards: SubAwardData[] = [];
      let page = 1;
      let hasNext = true;

      while (hasNext && allSubAwards.length < this.options.maxPerAward) {
        const raw = await this.fetchPage(awardId, page);
        const parsed = SubAwardResponseSchema.parse(raw);

        for (const record of parsed.results) {
          if (allSubAwards.length >= this.options.maxPerAward) break;
          allSubAwards.push(this.mapSubAward(record, awardId));
        }

        hasNext = parsed.page_metadata.hasNext;
        page++;
      }

      await this.cache.set(cacheKey, allSubAwards);

      this.options.logger.info(
        { awardId, count: allSubAwards.length },
        "Fetched sub-awards",
      );

      return {
        data: allSubAwards,
        provenance: this.makeProvenance(false),
      };
    } catch (err) {
      this.options.logger.error(
        { error: (err as Error).message, awardId },
        "Sub-awards fetch failed",
      );
      return {
        data: [],
        provenance: this.makeProvenance(false),
        errors: [(err as Error).message],
      };
    }
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private mapSubAward(
    raw: z.infer<typeof SubAwardRecordSchema>,
    primeAwardId: string,
  ): SubAwardData {
    return {
      subawardNumber: raw.subaward_number,
      amount: raw.amount,
      actionDate: raw.action_date,
      recipientName: raw.recipient_name,
      recipientUei: raw.recipient_unique_id ?? undefined,
      description: raw.description ?? undefined,
      primeAwardId,
      primeRecipientName: raw.prime_recipient_name ?? undefined,
      placeOfPerformance: raw.place_of_performance
        ? {
            city: raw.place_of_performance.city_name ?? undefined,
            state: raw.place_of_performance.state_code ?? undefined,
            country: raw.place_of_performance.country_code ?? undefined,
          }
        : undefined,
    };
  }

  private async fetchPage(awardId: string, page: number): Promise<unknown> {
    const url = `${this.options.baseUrl}/subawards/`;
    const body = {
      award_id: awardId,
      limit: 100,
      page,
      sort: "subaward_number",
      order: "asc",
    };

    return pRetry(
      async () => {
        const response = await this.throttledFetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
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
            { attempt: error.attemptNumber, awardId, page },
            "Sub-awards request failed, retrying...",
          );
        },
      },
    );
  }
}
