/**
 * USAspending API client.
 * Handles pagination, throttling, retries, and caching.
 */
import pRetry from "p-retry";
import pThrottle from "p-throttle";
import type pino from "pino";
import { ResponseCache } from "./cache.js";
import type {
  AwardSearchFilters,
  AwardSearchResponse,
  AwardSearchResult,
  AwardDetailResponse,
  TransactionResponse,
  TransactionResult,
  SpendingByCategoryResponse,
  CollectionResult,
} from "./types.js";

export interface USAspendingClientOptions {
  baseUrl: string;
  requestsPerSecond: number;
  maxRetries: number;
  pageSize: number;
  cacheEnabled: boolean;
  cacheDirectory: string;
  logger: pino.Logger;
}

const SEARCH_FIELDS = [
  "Award ID",
  "Recipient Name",
  "Award Amount",
  "Total Outlays",
  "Description",
  "Start Date",
  "End Date",
  "Awarding Agency",
  "Awarding Sub Agency",
  "Funding Agency",
  "Contract Award Type",
  "recipient_id",
  "Recipient UEI",
  "NAICS Code",
  "PSC Code",
];

export class USAspendingClient {
  private cache: ResponseCache;
  private throttledFetch: typeof fetch;

  constructor(private options: USAspendingClientOptions) {
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

  // ─── Award Search ────────────────────────────────────────────────────────

  async searchAllAwards(
    filters: AwardSearchFilters,
    pageLimit = 100,
  ): Promise<{ awards: AwardSearchResult[]; totalPages: number; cacheHits: number; cacheMisses: number }> {
    const allAwards: AwardSearchResult[] = [];
    let page = 1;
    let hasNext = true;
    let lastRecordId: number | undefined;
    let lastSortValue: string | undefined;
    let cacheHits = 0;
    let cacheMisses = 0;

    while (hasNext && page <= pageLimit) {
      const cacheKey = `search:${JSON.stringify(filters)}:page=${page}:cursor=${lastRecordId ?? "none"}`;
      let response = await this.cache.get<AwardSearchResponse>(cacheKey);

      if (response) {
        cacheHits++;
      } else {
        cacheMisses++;
        const body: Record<string, unknown> = {
          filters,
          fields: SEARCH_FIELDS,
          limit: this.options.pageSize,
          page: 1, // Always page 1 when using cursor
          sort: "Award Amount",
          order: "desc",
        };

        if (lastRecordId != null) {
          body.last_record_unique_id = lastRecordId;
          body.last_record_sort_value = lastSortValue;
        } else {
          body.page = page;
        }

        response = await this.fetchWithRetry<AwardSearchResponse>(
          `${this.options.baseUrl}/search/spending_by_award/`,
          body,
        );
        await this.cache.set(cacheKey, response);
      }

      allAwards.push(...response.results);
      hasNext = response.page_metadata.hasNext;
      lastRecordId = response.page_metadata.last_record_unique_id;
      lastSortValue = response.page_metadata.last_record_sort_value;

      this.options.logger.info(
        { page, results: response.results.length, total: allAwards.length, hasNext },
        "Fetched award search page",
      );
      page++;
    }

    return { awards: allAwards, totalPages: page - 1, cacheHits, cacheMisses };
  }

  // ─── Award Detail ────────────────────────────────────────────────────────

  async getAwardDetail(internalId: string): Promise<AwardDetailResponse> {
    const cacheKey = `detail:${internalId}`;
    const cached = await this.cache.get<AwardDetailResponse>(cacheKey);
    if (cached) return cached;

    const response = await this.fetchWithRetry<AwardDetailResponse>(
      `${this.options.baseUrl}/awards/${encodeURIComponent(internalId)}/`,
      null, // GET request
    );
    await this.cache.set(cacheKey, response);
    return response;
  }

  // ─── Transactions ────────────────────────────────────────────────────────

  async getAllTransactions(awardInternalId: string): Promise<TransactionResult[]> {
    const cacheKey = `transactions:${awardInternalId}`;
    const cached = await this.cache.get<TransactionResult[]>(cacheKey);
    if (cached) return cached;

    const allTransactions: TransactionResult[] = [];
    let page = 1;
    let hasNext = true;

    while (hasNext) {
      const response = await this.fetchWithRetry<TransactionResponse>(
        `${this.options.baseUrl}/transactions/`,
        {
          award_id: awardInternalId,
          limit: 100,
          page,
          sort: "action_date",
          order: "asc",
        },
      );
      allTransactions.push(...response.results);
      hasNext = response.page_metadata.hasNext;
      page++;
    }

    await this.cache.set(cacheKey, allTransactions);
    return allTransactions;
  }

  // ─── Spending by Category ────────────────────────────────────────────────

  async getSpendingByRecipient(
    filters: AwardSearchFilters,
    limit = 50,
  ): Promise<SpendingByCategoryResponse> {
    const cacheKey = `spending_by_recipient:${JSON.stringify(filters)}:limit=${limit}`;
    const cached = await this.cache.get<SpendingByCategoryResponse>(cacheKey);
    if (cached) return cached;

    const response = await this.fetchWithRetry<SpendingByCategoryResponse>(
      `${this.options.baseUrl}/search/spending_by_category/recipient/`,
      { filters, limit, page: 1 },
    );
    await this.cache.set(cacheKey, response);
    return response;
  }

  // ─── Full Collection Pipeline ────────────────────────────────────────────

  async collect(
    filters: AwardSearchFilters,
    opts: { withDetails?: boolean; withTransactions?: boolean; pageLimit?: number } = {},
  ): Promise<CollectionResult> {
    await this.initialize();

    const { awards, totalPages, cacheHits, cacheMisses } = await this.searchAllAwards(
      filters,
      opts.pageLimit,
    );

    const awardDetails = new Map<string, AwardDetailResponse>();
    const transactions = new Map<string, TransactionResult[]>();

    if (opts.withDetails) {
      this.options.logger.info({ count: awards.length }, "Fetching award details");
      for (const award of awards) {
        try {
          const detail = await this.getAwardDetail(award.generated_internal_id);
          awardDetails.set(award.generated_internal_id, detail);
        } catch (err) {
          this.options.logger.warn(
            { awardId: award["Award ID"], error: (err as Error).message },
            "Failed to fetch award detail",
          );
        }
      }
    }

    if (opts.withTransactions) {
      this.options.logger.info({ count: awards.length }, "Fetching transaction histories");
      for (const award of awards) {
        try {
          const txns = await this.getAllTransactions(award.generated_internal_id);
          transactions.set(award.generated_internal_id, txns);
        } catch (err) {
          this.options.logger.warn(
            { awardId: award["Award ID"], error: (err as Error).message },
            "Failed to fetch transactions",
          );
        }
      }
    }

    return {
      awards,
      awardDetails,
      transactions,
      totalPages,
      totalRecords: awards.length,
      cacheHits,
      cacheMisses,
    };
  }

  // ─── HTTP helpers ────────────────────────────────────────────────────────

  private async fetchWithRetry<T>(url: string, body: unknown): Promise<T> {
    return pRetry(
      async () => {
        const isGet = body === null;
        const response = await this.throttledFetch(url, {
          method: isGet ? "GET" : "POST",
          headers: isGet ? {} : { "Content-Type": "application/json" },
          body: isGet ? undefined : JSON.stringify(body),
        });

        if (response.status === 429) {
          throw new Error("Rate limited (429)");
        }

        if (!response.ok) {
          const text = await response.text().catch(() => "");
          throw new Error(`HTTP ${response.status}: ${text.slice(0, 200)}`);
        }

        return (await response.json()) as T;
      },
      {
        retries: this.options.maxRetries,
        minTimeout: 1000,
        onFailedAttempt: (error) => {
          this.options.logger.warn(
            { attempt: error.attemptNumber, url: url.slice(0, 80) },
            `Request failed, retrying...`,
          );
        },
      },
    );
  }
}
