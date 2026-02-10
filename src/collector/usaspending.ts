/**
 * USAspending API client stub.
 * Will be implemented in Phase 2.
 */
import type {
  AwardSearchFilters,
  AwardSearchResponse,
  AwardDetailResponse,
  TransactionResponse,
  SpendingByCategoryResponse,
} from "./types.js";

export interface USAspendingClientOptions {
  baseUrl: string;
  requestsPerSecond: number;
  maxRetries: number;
  pageSize: number;
  cacheEnabled: boolean;
  cacheDirectory: string;
}

export class USAspendingClient {
  constructor(private options: USAspendingClientOptions) {}

  async searchAwards(
    _filters: AwardSearchFilters,
    _page: number,
  ): Promise<AwardSearchResponse> {
    // TODO: Phase 2 - implement with pagination, caching, retry
    throw new Error("Not yet implemented");
  }

  async getAwardDetail(_internalId: string): Promise<AwardDetailResponse> {
    // TODO: Phase 2 - implement with caching
    throw new Error("Not yet implemented");
  }

  async getTransactions(
    _awardId: string,
    _page: number,
  ): Promise<TransactionResponse> {
    // TODO: Phase 2 - implement with pagination
    throw new Error("Not yet implemented");
  }

  async getSpendingByRecipient(
    _filters: AwardSearchFilters,
    _page: number,
  ): Promise<SpendingByCategoryResponse> {
    // TODO: Phase 2 - implement
    throw new Error("Not yet implemented");
  }
}
