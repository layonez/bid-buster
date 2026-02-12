/**
 * R002: Non-Competitive Awards
 *
 * Flags awards made without open competition.
 * High rates of non-competed awards may indicate favoritism or misuse of exceptions.
 *
 * Methodology: OECD Guidelines, Fazekas & Kocsis corruption risk index
 */
import type { NormalizedAward } from "../../normalizer/schema.js";
import type { Signal } from "../../shared/types.js";
import type { IndicatorConfig } from "../types.js";
import { BaseIndicator } from "./base.js";

interface RecipientNonCompeted {
  recipientName: string;
  nonCompetedCount: number;
  totalCount: number;
  totalNonCompetedAmount: number;
  totalAmount: number;
  awardIds: string[];
}

export class NonCompetitiveIndicator extends BaseIndicator {
  readonly id = "R002";
  readonly name = "Non-Competitive Awards";
  readonly description =
    "Flags awards made without open competition (sole-source, non-competed)";

  private codesToFlag = new Set(["B", "C", "G", "NDO"]);
  private byRecipient = new Map<string, RecipientNonCompeted>();

  configure(settings: IndicatorConfig): void {
    if (Array.isArray(settings.codesToFlag)) {
      this.codesToFlag = new Set(settings.codesToFlag as string[]);
    }
  }

  fold(award: NormalizedAward): void {
    this.totalRecords++;

    if (!award.extentCompeted) return;
    this.recordsWithRequiredFields++;

    const key = award.recipientName;
    if (!this.byRecipient.has(key)) {
      this.byRecipient.set(key, {
        recipientName: award.recipientName,
        nonCompetedCount: 0,
        totalCount: 0,
        totalNonCompetedAmount: 0,
        totalAmount: 0,
        awardIds: [],
      });
    }

    const stats = this.byRecipient.get(key)!;
    stats.totalCount++;
    stats.totalAmount += award.awardAmount;

    if (this.codesToFlag.has(award.extentCompeted)) {
      stats.nonCompetedCount++;
      stats.totalNonCompetedAmount += award.awardAmount;
      stats.awardIds.push(award.awardId);
    }
  }

  finalize(): Signal[] {
    const signals: Signal[] = [];

    for (const [, stats] of this.byRecipient) {
      if (stats.nonCompetedCount === 0) continue;

      const rate = stats.nonCompetedCount / stats.totalCount;
      const amountRate = stats.totalNonCompetedAmount / stats.totalAmount;

      signals.push({
        indicatorId: this.id,
        indicatorName: this.name,
        severity:
          rate >= 0.8
            ? "high"
            : rate >= 0.5
              ? "medium"
              : "low",
        entityType: "recipient",
        entityId: stats.recipientName,
        entityName: stats.recipientName,
        value: Math.round(rate * 1000) / 10,
        threshold: 50, // 50% as reference
        context:
          `${stats.nonCompetedCount} of ${stats.totalCount} ${stats.totalCount === 1 ? "award" : "awards"} ` +
          `(${(rate * 100).toFixed(1)}%) to ${stats.recipientName} ${stats.nonCompetedCount === 1 ? "was" : "were"} non-competitive. ` +
          `Non-competed amount: $${stats.totalNonCompetedAmount.toLocaleString()} ` +
          `(${(amountRate * 100).toFixed(1)}% of total).`,
        affectedAwards: stats.awardIds,
      });
    }

    return signals.sort((a, b) => b.value - a.value);
  }

  protected getMethodology(): string {
    return (
      "Identifies awards with extent_competed codes indicating no open competition " +
      "(B=Not Available, C=Not Competed, G=Not Competed Under SAP, NDO=Non-Competitive Delivery Order). " +
      "Based on OECD Guidelines and Fazekas & Kocsis corruption risk methodology."
    );
  }

  protected getThresholds(): Record<string, number> {
    return { codesToFlagCount: this.codesToFlag.size };
  }
}
