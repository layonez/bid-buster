/**
 * R006: Price Outliers
 *
 * Flags awards with abnormally high amounts compared to peers
 * in the same NAICS/PSC category.
 *
 * Methodology: Cardinal-rs IQR method, z-score alternative
 */
import { quantile, standardDeviation, mean } from "simple-statistics";
import type { NormalizedAward } from "../../normalizer/schema.js";
import type { Signal } from "../../shared/types.js";
import type { IndicatorConfig } from "../types.js";
import { BaseIndicator } from "./base.js";

interface CategoryGroup {
  code: string;
  amounts: number[];
  awards: Array<{ id: string; amount: number; recipient: string }>;
}

export class PriceOutliersIndicator extends BaseIndicator {
  readonly id = "R006";
  readonly name = "Price Outliers";
  readonly description =
    "Flags awards with abnormally high amounts vs same-category peers";

  private method: "iqr" | "zscore" = "iqr";
  private iqrMultiplier = 1.5;
  private zscoreThreshold = 2.0;
  private minGroupSize = 5;
  private byCategory = new Map<string, CategoryGroup>();

  configure(settings: IndicatorConfig): void {
    if (settings.method === "iqr" || settings.method === "zscore") {
      this.method = settings.method;
    }
    if (typeof settings.iqrMultiplier === "number") {
      this.iqrMultiplier = settings.iqrMultiplier;
    }
    if (typeof settings.zscoreThreshold === "number") {
      this.zscoreThreshold = settings.zscoreThreshold;
    }
    if (typeof settings.minGroupSize === "number") {
      this.minGroupSize = settings.minGroupSize;
    }
  }

  fold(award: NormalizedAward): void {
    this.totalRecords++;

    const categoryCode = award.naicsCode ?? award.pscCode;
    if (!categoryCode || award.awardAmount <= 0) return;
    this.recordsWithRequiredFields++;

    if (!this.byCategory.has(categoryCode)) {
      this.byCategory.set(categoryCode, {
        code: categoryCode,
        amounts: [],
        awards: [],
      });
    }

    const group = this.byCategory.get(categoryCode)!;
    group.amounts.push(award.awardAmount);
    group.awards.push({
      id: award.awardId,
      amount: award.awardAmount,
      recipient: award.recipientName,
    });
  }

  finalize(): Signal[] {
    const signals: Signal[] = [];

    for (const [categoryCode, group] of this.byCategory) {
      if (group.amounts.length < this.minGroupSize) continue;

      const sorted = [...group.amounts].sort((a, b) => a - b);
      let upperFence: number;

      if (this.method === "iqr") {
        const q1 = quantile(sorted, 0.25);
        const q3 = quantile(sorted, 0.75);
        const iqr = q3 - q1;
        upperFence = q3 + iqr * this.iqrMultiplier;
      } else {
        const m = mean(sorted);
        const sd = standardDeviation(sorted);
        upperFence = m + sd * this.zscoreThreshold;
      }

      for (const award of group.awards) {
        if (award.amount > upperFence) {
          const m = mean(sorted);
          const factor = m > 0 ? award.amount / m : 0;

          signals.push({
            indicatorId: this.id,
            indicatorName: this.name,
            severity: factor >= 5 ? "high" : factor >= 2 ? "medium" : "low",
            entityType: "award",
            entityId: award.id,
            entityName: `${award.id} (${award.recipient})`,
            value: Math.round(factor * 10) / 10,
            threshold: Math.round(upperFence),
            context:
              `Award ${award.id} ($${award.amount.toLocaleString()}) to ${award.recipient} ` +
              `is ${factor.toFixed(1)}x the category mean ($${m.toLocaleString()}) ` +
              `for ${categoryCode} (n=${group.amounts.length}). ` +
              `Upper fence: $${upperFence.toLocaleString()} (${this.method} method).`,
            affectedAwards: [award.id],
          });
        }
      }
    }

    return signals.sort((a, b) => b.value - a.value);
  }

  protected getMethodology(): string {
    return this.method === "iqr"
      ? `Groups awards by NAICS/PSC code, computes Q1/Q3/IQR, flags amounts above Q3 + ${this.iqrMultiplier}*IQR. ` +
          "Inspired by Cardinal-rs quartile-based thresholding."
      : `Groups awards by NAICS/PSC code, flags amounts >${this.zscoreThreshold} standard deviations above mean.`;
  }

  protected getThresholds(): Record<string, number> {
    return {
      minGroupSize: this.minGroupSize,
      ...(this.method === "iqr"
        ? { iqrMultiplier: this.iqrMultiplier }
        : { zscoreThreshold: this.zscoreThreshold }),
    };
  }
}
