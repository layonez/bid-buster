/**
 * Types for USAspending API requests and responses.
 */

// ─── Search Request ──────────────────────────────────────────────────────────

export interface AwardSearchFilters {
  award_type_codes: string[];
  time_period?: Array<{ start_date: string; end_date: string }>;
  agencies?: Array<{
    type: "awarding" | "funding";
    tier: "toptier" | "subtier";
    name: string;
  }>;
  recipient_search_text?: string[];
  award_amounts?: Array<{
    lower_bound?: number;
    upper_bound?: number;
  }>;
  extent_competed_type_codes?: string[];
  naics_codes?: { require: string[] };
  psc_codes?: { require: string[][] };
  keywords?: string[];
}

export interface AwardSearchRequest {
  filters: AwardSearchFilters;
  fields: string[];
  limit: number;
  page: number;
  sort: string;
  order: "asc" | "desc";
  last_record_unique_id?: number;
  last_record_sort_value?: string;
}

// ─── Search Response ─────────────────────────────────────────────────────────

export interface AwardSearchResult {
  internal_id: number;
  generated_internal_id: string;
  "Award ID": string;
  "Recipient Name": string;
  "Award Amount": number;
  "Total Outlays"?: number;
  Description?: string;
  "Start Date"?: string;
  "End Date"?: string;
  "Awarding Agency"?: string;
  "Awarding Sub Agency"?: string;
  "Funding Agency"?: string;
  "Contract Award Type"?: string;
  recipient_id?: string;
  "Recipient UEI"?: string;
  "NAICS Code"?: string;
  "PSC Code"?: string;
  [key: string]: unknown;
}

export interface PageMetadata {
  page: number;
  hasNext: boolean;
  hasPrevious?: boolean;
  next?: number;
  previous?: number;
  last_record_unique_id?: number;
  last_record_sort_value?: string;
}

export interface AwardSearchResponse {
  spending_level: string;
  limit: number;
  results: AwardSearchResult[];
  page_metadata: PageMetadata;
  messages?: Array<{ message: string }>;
}

// ─── Award Detail ────────────────────────────────────────────────────────────

export interface AwardDetailResponse {
  id: number;
  generated_unique_award_id: string;
  piid?: string;
  fain?: string;
  category: string;
  type: string;
  type_description: string;
  description: string;
  total_obligation: number;
  base_exercised_options?: number;
  base_and_all_options?: number;
  date_signed?: string;
  subaward_count: number;
  total_subaward_amount: number;

  period_of_performance: {
    start_date?: string;
    end_date?: string;
    last_modified_date?: string;
    potential_end_date?: string;
  };

  recipient: {
    recipient_name: string;
    recipient_uei?: string;
    recipient_hash?: string;
    parent_recipient_name?: string;
    parent_recipient_uei?: string;
    business_categories?: string[];
    location?: Record<string, unknown>;
  };

  awarding_agency?: {
    toptier_agency?: { name: string; code: string };
    subtier_agency?: { name: string; code: string };
    office_agency_name?: string;
  };

  funding_agency?: {
    toptier_agency?: { name: string; code: string };
    subtier_agency?: { name: string; code: string };
  };

  latest_transaction_contract_data?: {
    extent_competed?: string;
    extent_competed_description?: string;
    number_of_offers_received?: number | null;
    solicitation_procedures?: string;
    solicitation_procedures_description?: string;
    other_than_full_and_open?: string;
    other_than_full_and_open_description?: string;
    type_of_contract_pricing?: string;
    type_of_contract_pricing_description?: string;
    fed_biz_opps?: string;
    fed_biz_opps_description?: string;
    type_set_aside?: string;
    type_set_aside_description?: string;
    fair_opportunity_limited?: string;
    fair_opportunity_limited_description?: string;
    product_or_service_code?: string;
    naics?: string;
    naics_description?: string;
    [key: string]: unknown;
  };

  parent_award?: {
    piid?: string;
    agency_id?: string;
    agency_name?: string;
  };

  executive_details?: {
    officers?: Array<{
      name: string;
      amount: number;
    }>;
  };

  [key: string]: unknown;
}

// ─── Transactions ────────────────────────────────────────────────────────────

export interface TransactionRequest {
  award_id: string;
  limit: number;
  page: number;
  sort: string;
  order: "asc" | "desc";
}

export interface TransactionResult {
  id: number;
  type: string;
  type_description: string;
  action_date: string;
  action_type?: string;
  action_type_description?: string;
  modification_number: string;
  description?: string;
  federal_action_obligation: number;
  face_value_loan_guarantee?: number;
  original_loan_subsidy_cost?: number;
}

export interface TransactionResponse {
  page_metadata: PageMetadata;
  results: TransactionResult[];
}

// ─── Spending by Category ────────────────────────────────────────────────────

export interface SpendingByCategoryResult {
  amount: number;
  recipient_id?: string;
  name: string;
  code?: string;
  uei?: string;
  total_outlays?: number;
}

export interface SpendingByCategoryResponse {
  category: string;
  spending_level: string;
  limit: number;
  page_metadata: PageMetadata;
  results: SpendingByCategoryResult[];
  messages?: Array<{ message: string }>;
}

// ─── Collection Result ───────────────────────────────────────────────────────

export interface CollectionResult {
  awards: AwardSearchResult[];
  awardDetails: Map<string, AwardDetailResponse>;
  transactions: Map<string, TransactionResult[]>;
  totalPages: number;
  totalRecords: number;
  cacheHits: number;
  cacheMisses: number;
}
