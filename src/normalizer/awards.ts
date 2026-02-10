/**
 * Normalize raw USAspending API responses to canonical schema.
 * Will be fully implemented in Phase 2.
 */
import type { AwardSearchResult, AwardDetailResponse } from "../collector/types.js";
import type { NormalizedAward } from "./schema.js";

/**
 * Normalize a search result into a NormalizedAward.
 * Basic fields only -- competition data requires detail enrichment.
 */
export function normalizeSearchResult(
  result: AwardSearchResult,
): NormalizedAward {
  return {
    awardId: result["Award ID"],
    internalId: result.generated_internal_id,
    recipientName: result["Recipient Name"],
    recipientUei: result["Recipient UEI"] ?? undefined,
    recipientId: result.recipient_id ?? undefined,
    awardingAgency: result["Awarding Agency"] ?? "Unknown",
    awardingSubAgency: result["Awarding Sub Agency"] ?? undefined,
    fundingAgency: result["Funding Agency"] ?? undefined,
    awardAmount: result["Award Amount"],
    awardType: result["Contract Award Type"] ?? "Unknown",
    naicsCode: result["NAICS Code"] ?? undefined,
    pscCode: result["PSC Code"] ?? undefined,
    description: result.Description ?? undefined,
    startDate: result["Start Date"] ?? "",
    endDate: result["End Date"] ?? undefined,
  };
}

/**
 * Enrich a NormalizedAward with data from the award detail endpoint.
 */
export function enrichWithDetail(
  award: NormalizedAward,
  detail: AwardDetailResponse,
): NormalizedAward {
  const contract = detail.latest_transaction_contract_data;
  return {
    ...award,
    totalObligation: detail.total_obligation,
    baseExercisedOptions: detail.base_exercised_options ?? undefined,
    baseAndAllOptions: detail.base_and_all_options ?? undefined,
    extentCompeted: contract?.extent_competed ?? undefined,
    extentCompetedDescription:
      contract?.extent_competed_description ?? undefined,
    numberOfOffersReceived:
      contract?.number_of_offers_received ?? undefined,
    solicitationProcedures:
      contract?.solicitation_procedures ?? undefined,
    otherThanFullAndOpen:
      contract?.other_than_full_and_open ?? undefined,
    typeOfContractPricing:
      contract?.type_of_contract_pricing ?? undefined,
    typeOfContractPricingDescription:
      contract?.type_of_contract_pricing_description ?? undefined,
    fedBizOpps: contract?.fed_biz_opps ?? undefined,
    typeSetAside: contract?.type_set_aside ?? undefined,
    naicsCode: contract?.naics ?? award.naicsCode,
    naicsDescription: contract?.naics_description ?? undefined,
    startDate:
      detail.period_of_performance?.start_date ?? award.startDate,
    endDate: detail.period_of_performance?.end_date ?? award.endDate,
    lastModifiedDate:
      detail.period_of_performance?.last_modified_date ?? undefined,
  };
}
