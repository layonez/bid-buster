/**
 * R005: Excessive Contract Modifications
 *
 * Flags contracts with an unusually high number of modifications
 * or significant cost growth post-award.
 *
 * Methodology: OECD procurement integrity guidelines
 */
import type { NormalizedAward, Transaction } from "../../normalizer/schema.js";
import type { Signal } from "../../shared/types.js";
import type { IndicatorConfig } from "../types.js";
import { BaseIndicator } from "./base.js";

interface AwardModStats {
  awardId: string;
  recipientName: string;
  agency: string;
  originalAmount: number;
  currentAmount: number;
  modificationCount: number;
  totalModAmount: number;
}

export class ModificationsIndicator extends BaseIndicator {
  readonly id = "R005";
  readonly name = "Excessive Modifications";
  readonly description =
    "Flags contracts with too many modifications or excessive cost growth";

  private maxModificationCount = 5;
  private maxGrowthRatio = 2.0;
  private byAward = new Map<string, AwardModStats>();

  configure(settings: IndicatorConfig): void {
    if (typeof settings.maxModificationCount === "number") {
      this.maxModificationCount = settings.maxModificationCount;
    }
    if (typeof settings.maxGrowthRatio === "number") {
      this.maxGrowthRatio = settings.maxGrowthRatio;
    }
  }

  fold(award: NormalizedAward): void {
    this.totalRecords++;
    if (award.modificationCount == null) return;
    this.recordsWithRequiredFields++;

    this.byAward.set(award.awardId, {
      awardId: award.awardId,
      recipientName: award.recipientName,
      agency: award.awardingAgency,
      originalAmount: award.awardAmount,
      currentAmount: award.totalObligation ?? award.awardAmount,
      modificationCount: award.modificationCount ?? 0,
      totalModAmount: award.totalModificationAmount ?? 0,
    });
  }

  foldTransactions(awardId: string, transactions: Transaction[]): void {
    if (!this.byAward.has(awardId)) return;

    const stats = this.byAward.get(awardId)!;
    // Filter out administrative (zero-dollar) modifications
    const substantiveMods = transactions.filter(
      (t) =>
        t.modificationNumber !== "0" &&
        t.federalActionObligation !== 0,
    );
    stats.modificationCount = substantiveMods.length;
    stats.totalModAmount = substantiveMods.reduce(
      (sum, t) => sum + t.federalActionObligation,
      0,
    );
  }

  finalize(): Signal[] {
    const signals: Signal[] = [];

    for (const [, stats] of this.byAward) {
      const growthRatio =
        stats.originalAmount > 0
          ? stats.currentAmount / stats.originalAmount
          : 1;

      const countExceeded = stats.modificationCount > this.maxModificationCount;
      const growthExceeded = growthRatio > this.maxGrowthRatio;

      if (countExceeded || growthExceeded) {
        signals.push({
          indicatorId: this.id,
          indicatorName: this.name,
          severity:
            countExceeded && growthExceeded
              ? "high"
              : growthExceeded
                ? "high"
                : "medium",
          entityType: "award",
          entityId: stats.awardId,
          entityName: `${stats.awardId} (${stats.recipientName})`,
          value: Math.max(stats.modificationCount, growthRatio * 100),
          threshold: countExceeded
            ? this.maxModificationCount
            : this.maxGrowthRatio * 100,
          context:
            `Contract ${stats.awardId} to ${stats.recipientName}: ` +
            `${stats.modificationCount} modifications, ` +
            `cost grew from $${stats.originalAmount.toLocaleString()} ` +
            `to $${stats.currentAmount.toLocaleString()} ` +
            `(${((growthRatio - 1) * 100).toFixed(0)}% increase).`,
          affectedAwards: [stats.awardId],
        });
      }
    }

    return signals.sort((a, b) => b.value - a.value);
  }

  protected getMethodology(): string {
    return (
      "Counts substantive modifications (excluding $0 admin changes) per contract. " +
      `Flags contracts with >${this.maxModificationCount} modifications or ` +
      `cost growth >${((this.maxGrowthRatio - 1) * 100).toFixed(0)}%. ` +
      "Based on OECD procurement integrity guidelines."
    );
  }

  protected getThresholds(): Record<string, number> {
    return {
      maxModificationCount: this.maxModificationCount,
      maxGrowthRatio: this.maxGrowthRatio,
    };
  }
}
