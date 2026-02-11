/**
 * Collector module: orchestrates data collection, normalization, and snapshot.
 */
import type pino from "pino";
import type { AppConfig } from "../cli/config.js";
import type { AwardSearchFilters, CollectionResult } from "./types.js";
import type { NormalizedAward, Transaction } from "../normalizer/schema.js";
import { USAspendingClient } from "./usaspending.js";
import { normalizeSearchResult, enrichWithDetail } from "../normalizer/awards.js";
import { normalizeTransaction } from "../normalizer/transactions.js";
import { writeJson } from "../shared/fs.js";
import { join } from "node:path";
import { mkdir } from "node:fs/promises";

export interface CollectorParams {
  agency?: string;
  subtierAgency?: string;
  recipient?: string;
  periodStart: string;
  periodEnd: string;
  awardTypeCodes: string[];
  withDetails: boolean;
  withTransactions: boolean;
  pageLimit: number;
}

export interface CollectorResult {
  awards: NormalizedAward[];
  transactions: Map<string, Transaction[]>;
  raw: CollectionResult;
  snapshotDir: string;
}

/**
 * Build USAspending search filters from collector params.
 * Exported for testing.
 */
export function buildSearchFilters(params: CollectorParams): AwardSearchFilters {
  const filters: AwardSearchFilters = {
    award_type_codes: params.awardTypeCodes,
    time_period: [{ start_date: params.periodStart, end_date: params.periodEnd }],
  };

  if (params.subtierAgency) {
    filters.agencies = [{ type: "awarding", tier: "subtier", name: params.subtierAgency }];
  } else if (params.agency) {
    filters.agencies = [{ type: "awarding", tier: "toptier", name: params.agency }];
  }
  if (params.recipient) {
    filters.recipient_search_text = [params.recipient];
  }

  return filters;
}

export async function runCollector(
  params: CollectorParams,
  config: AppConfig,
  logger: pino.Logger,
): Promise<CollectorResult> {
  const client = new USAspendingClient({
    baseUrl: config.api.baseUrl,
    requestsPerSecond: config.api.requestsPerSecond,
    maxRetries: config.api.maxRetries,
    pageSize: config.api.pageSize,
    cacheEnabled: config.cache.enabled,
    cacheDirectory: config.cache.directory,
    logger,
  });

  const filters = buildSearchFilters(params);

  // Collect
  const raw = await client.collect(filters, {
    withDetails: params.withDetails,
    withTransactions: params.withTransactions,
    pageLimit: params.pageLimit,
  });

  logger.info(
    { awards: raw.totalRecords, details: raw.awardDetails.size, cacheHits: raw.cacheHits },
    "Collection complete",
  );

  // Normalize
  let awards: NormalizedAward[] = raw.awards.map(normalizeSearchResult);

  if (raw.awardDetails.size > 0) {
    awards = awards.map((award) => {
      const detail = raw.awardDetails.get(award.internalId);
      return detail ? enrichWithDetail(award, detail) : award;
    });
  }

  // Normalize transactions
  const normalizedTransactions = new Map<string, Transaction[]>();
  for (const [awardId, txns] of raw.transactions) {
    normalizedTransactions.set(awardId, txns.map((t) => normalizeTransaction(awardId, t)));
  }

  // Enrich awards with modification counts from transactions
  if (normalizedTransactions.size > 0) {
    awards = awards.map((award) => {
      const txns = normalizedTransactions.get(award.internalId);
      if (!txns) return award;
      const substantive = txns.filter((t) => t.federalActionObligation !== 0);
      return {
        ...award,
        modificationCount: substantive.length,
        totalModificationAmount: substantive.reduce((s, t) => s + t.federalActionObligation, 0),
      };
    });
  }

  // Save snapshot
  const snapshotDir = join(config.cache.directory, "normalized");
  await mkdir(snapshotDir, { recursive: true });
  await writeJson(join(snapshotDir, "awards.json"), awards);

  logger.info(
    { path: join(snapshotDir, "awards.json"), count: awards.length },
    "Normalized awards saved",
  );

  return { awards, transactions: normalizedTransactions, raw, snapshotDir };
}
