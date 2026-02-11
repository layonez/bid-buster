/**
 * OpenSanctions Match API client.
 * Screens entities against sanctions, PEP, and debarment lists.
 * Gracefully degrades when API key is not configured.
 */
import pRetry from "p-retry";
import pThrottle from "p-throttle";
import { z } from "zod";
import type pino from "pino";
import { ResponseCache } from "../collector/cache.js";
import type {
  SanctionsScreenResult,
  SanctionsScreeningResult,
  EnrichmentProvenance,
} from "./types.js";

// ─── Zod Schemas for API response validation ────────────────────────────────

const MatchPropertiesSchema = z.object({
  topics: z.array(z.string()).default([]),
  country: z.array(z.string()).default([]),
}).passthrough();

const MatchResultSchema = z.object({
  id: z.string(),
  caption: z.string(),
  schema: z.string(),
  score: z.number(),
  datasets: z.array(z.string()).default([]),
  properties: MatchPropertiesSchema.default({ topics: [], country: [] }),
  referenceUrl: z.string().nullish(),
});

const MatchQueryResponseSchema = z.object({
  query: z.object({ properties: z.record(z.string(), z.unknown()) }).passthrough(),
  results: z.array(MatchResultSchema).default([]),
  total: z.object({ value: z.number() }).optional(),
});

const MatchResponseSchema = z.object({
  responses: z.record(z.string(), MatchQueryResponseSchema),
});

// ─── Client Options ─────────────────────────────────────────────────────────

export interface OpenSanctionsClientOptions {
  baseUrl: string;
  dataset: string;
  scoreThreshold: number;
  maxRetries: number;
  cacheDirectory: string;
  cacheEnabled: boolean;
  logger: pino.Logger;
}

// ─── Client ─────────────────────────────────────────────────────────────────

export class OpenSanctionsClient {
  private cache: ResponseCache;
  private throttledFetch: typeof fetch;
  private apiKey: string | undefined;

  constructor(private options: OpenSanctionsClientOptions) {
    this.cache = new ResponseCache(options.cacheDirectory, options.cacheEnabled);
    this.apiKey = process.env.OPENSANCTIONS_API_KEY;

    // OpenSanctions allows 2 req/sec for authenticated users
    const throttle = pThrottle({
      limit: 2,
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
      source: "open_sanctions",
      endpoint: `${this.options.baseUrl}/match/${this.options.dataset}`,
      timestamp: new Date().toISOString(),
      cacheHit,
      apiKeyUsed: !!this.apiKey,
    };
  }

  /**
   * Screen an entity name against sanctions/PEP/debarment lists.
   * Returns null if API key is not configured.
   */
  async screenEntity(
    name: string,
    schema: "Company" | "Person" = "Company",
  ): Promise<SanctionsScreeningResult | null> {
    if (!this.apiKey) {
      this.options.logger.warn(
        "OPENSANCTIONS_API_KEY not set, skipping sanctions screening",
      );
      return null;
    }

    const cacheKey = `opensanctions:${schema}:${name}`;

    const cached = await this.cache.get<SanctionsScreenResult>(cacheKey);
    if (cached) {
      return {
        data: cached,
        provenance: this.makeProvenance(true),
      };
    }

    try {
      const queryId = "q1";
      const body = {
        queries: {
          [queryId]: {
            schema,
            properties: {
              name: [name],
            },
          },
        },
        algorithm: "logic-v2",
      };

      const url = `${this.options.baseUrl}/match/${this.options.dataset}`;
      const raw = await this.fetchWithRetry(url, body);
      const parsed = MatchResponseSchema.parse(raw);

      const queryResponse = parsed.responses[queryId];
      if (!queryResponse) {
        return {
          data: {
            query: name,
            matchFound: false,
            score: 0,
            datasets: [],
            topics: [],
          },
          provenance: this.makeProvenance(false),
        };
      }

      // Find the best match above the score threshold
      const bestMatch = queryResponse.results
        .filter((r) => r.score >= this.options.scoreThreshold)
        .sort((a, b) => b.score - a.score)[0];

      const result: SanctionsScreenResult = bestMatch
        ? {
            query: name,
            matchFound: true,
            score: bestMatch.score,
            matchedName: bestMatch.caption,
            datasets: bestMatch.datasets,
            topics: bestMatch.properties.topics ?? [],
            entityType: bestMatch.schema,
            countries: bestMatch.properties.country ?? [],
            referenceUrl: bestMatch.referenceUrl ?? undefined,
          }
        : {
            query: name,
            matchFound: false,
            score: queryResponse.results[0]?.score ?? 0,
            datasets: [],
            topics: [],
          };

      await this.cache.set(cacheKey, result);

      return {
        data: result,
        provenance: this.makeProvenance(false),
      };
    } catch (err) {
      this.options.logger.error(
        { error: (err as Error).message, name },
        "OpenSanctions screening failed",
      );
      return {
        data: {
          query: name,
          matchFound: false,
          score: 0,
          datasets: [],
          topics: [],
        },
        provenance: this.makeProvenance(false),
        errors: [(err as Error).message],
      };
    }
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private async fetchWithRetry(url: string, body: unknown): Promise<unknown> {
    return pRetry(
      async () => {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          Accept: "application/json",
        };
        if (this.apiKey) {
          headers["Authorization"] = `ApiKey ${this.apiKey}`;
        }

        const response = await this.throttledFetch(url, {
          method: "POST",
          headers,
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
            { attempt: error.attemptNumber },
            "OpenSanctions request failed, retrying...",
          );
        },
      },
    );
  }
}
