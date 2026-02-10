/**
 * Canonical schema for normalized award records.
 * All data from USAspending is validated and transformed to this shape.
 */
import { z } from "zod";

export const NormalizedAwardSchema = z.object({
  // ─── Identifiers ─────────────────────────────────────────────────────
  awardId: z.string().describe("Contract PIID or FAIN"),
  internalId: z.string().describe("USAspending generated internal ID"),
  parentAwardId: z.string().optional().describe("Parent IDV PIID"),

  // ─── Parties ─────────────────────────────────────────────────────────
  recipientName: z.string(),
  recipientUei: z.string().optional(),
  recipientId: z.string().optional().describe("Recipient hash for API lookups"),
  awardingAgency: z.string(),
  awardingSubAgency: z.string().optional(),
  fundingAgency: z.string().optional(),

  // ─── Financials ──────────────────────────────────────────────────────
  awardAmount: z.number(),
  totalObligation: z.number().optional(),
  baseExercisedOptions: z.number().optional(),
  baseAndAllOptions: z.number().optional(),

  // ─── Classification ──────────────────────────────────────────────────
  awardType: z.string().describe("Award type code: A, B, C, D"),
  awardTypeDescription: z.string().optional(),
  naicsCode: z.string().optional(),
  naicsDescription: z.string().optional(),
  pscCode: z.string().optional(),
  pscDescription: z.string().optional(),
  description: z.string().optional(),

  // ─── Dates ───────────────────────────────────────────────────────────
  startDate: z.string().describe("ISO date string"),
  endDate: z.string().optional(),
  lastModifiedDate: z.string().optional(),

  // ─── Competition (from individual award detail) ──────────────────────
  extentCompeted: z.string().optional(),
  extentCompetedDescription: z.string().optional(),
  numberOfOffersReceived: z.number().nullable().optional(),
  solicitationProcedures: z.string().optional(),
  otherThanFullAndOpen: z.string().optional(),
  typeOfContractPricing: z.string().optional(),
  typeOfContractPricingDescription: z.string().optional(),
  fedBizOpps: z.string().optional().describe("Posted on SAM.gov?"),
  typeSetAside: z.string().optional(),

  // ─── Modifications (populated from transactions endpoint) ────────────
  modificationCount: z.number().optional(),
  totalModificationAmount: z.number().optional(),
});

export type NormalizedAward = z.infer<typeof NormalizedAwardSchema>;

/**
 * Schema for a single contract modification/transaction.
 */
export const TransactionSchema = z.object({
  id: z.number(),
  awardId: z.string(),
  modificationNumber: z.string(),
  actionDate: z.string(),
  actionType: z.string().optional(),
  actionTypeDescription: z.string().optional(),
  description: z.string().optional(),
  federalActionObligation: z.number(),
});

export type Transaction = z.infer<typeof TransactionSchema>;
