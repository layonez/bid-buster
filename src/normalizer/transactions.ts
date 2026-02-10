/**
 * Normalize raw transaction results from the USAspending API.
 */
import type { TransactionResult } from "../collector/types.js";
import type { Transaction } from "./schema.js";

export function normalizeTransaction(
  awardId: string,
  raw: TransactionResult,
): Transaction {
  return {
    id: raw.id,
    awardId,
    modificationNumber: raw.modification_number,
    actionDate: raw.action_date,
    actionType: raw.action_type ?? undefined,
    actionTypeDescription: raw.action_type_description ?? undefined,
    description: raw.description ?? undefined,
    federalActionObligation: raw.federal_action_obligation ?? 0,
  };
}
