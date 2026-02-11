/**
 * R003: Contract Value Splitting
 *
 * Detects clusters of awards just below regulatory thresholds,
 * suggesting deliberate splitting to avoid competition requirements.
 *
 * Methodology: OCP Red Flags Guide, Italian procurement studies
 */
import type { NormalizedAward } from "../../normalizer/schema.js";
import type { Signal } from "../../shared/types.js";
import type { IndicatorConfig } from "../types.js";
import { BaseIndicator } from "./base.js";

interface SplittingCluster {
  agency: string;
  recipient: string;
  period: string;
  threshold: number;
  awardsInBand: string[];
  totalAwards: number;
  amounts: number[];
}

export class SplittingIndicator extends BaseIndicator {
  readonly id = "R003";
  readonly name = "Contract Value Splitting";
  readonly description =
    "Detects clusters of awards just below regulatory thresholds";

  private thresholds = [250_000, 7_500_000];
  private bandWidthPct = 0.1;
  private minClusterSize = 3;
  private period: "quarter" | "year" = "quarter";

  private clusters = new Map<string, SplittingCluster>();

  configure(settings: IndicatorConfig): void {
    if (Array.isArray(settings.thresholds)) {
      this.thresholds = settings.thresholds as number[];
    }
    if (typeof settings.bandWidthPct === "number") {
      this.bandWidthPct = settings.bandWidthPct;
    }
    if (typeof settings.minClusterSize === "number") {
      this.minClusterSize = settings.minClusterSize;
    }
    if (settings.period === "quarter" || settings.period === "year") {
      this.period = settings.period;
    }
  }

  fold(award: NormalizedAward): void {
    this.totalRecords++;
    if (!award.startDate || award.awardAmount <= 0) return;
    this.recordsWithRequiredFields++;

    const periodKey = this.getPeriodKey(award.startDate);

    for (const threshold of this.thresholds) {
      const lowerBound = threshold * (1 - this.bandWidthPct);

      if (award.awardAmount >= lowerBound && award.awardAmount < threshold) {
        const key = `${award.awardingAgency}|${award.recipientName}|${periodKey}|${threshold}`;

        if (!this.clusters.has(key)) {
          this.clusters.set(key, {
            agency: award.awardingAgency,
            recipient: award.recipientName,
            period: periodKey,
            threshold,
            awardsInBand: [],
            totalAwards: 0,
            amounts: [],
          });
        }

        const cluster = this.clusters.get(key)!;
        cluster.awardsInBand.push(award.awardId);
        cluster.amounts.push(award.awardAmount);
      }
    }
  }

  finalize(): Signal[] {
    const signals: Signal[] = [];

    for (const [, cluster] of this.clusters) {
      if (cluster.awardsInBand.length < this.minClusterSize) continue;

      const avgAmount =
        cluster.amounts.reduce((a, b) => a + b, 0) / cluster.amounts.length;

      signals.push({
        indicatorId: this.id,
        indicatorName: this.name,
        severity:
          cluster.awardsInBand.length >= this.minClusterSize * 2
            ? "high"
            : "medium",
        entityType: "agency",
        entityId: cluster.agency,
        entityName: cluster.agency,
        value: cluster.awardsInBand.length,
        threshold: cluster.threshold,
        context:
          `${cluster.awardsInBand.length} awards from ${cluster.agency} to ${cluster.recipient} ` +
          `during ${cluster.period} fall within ${(this.bandWidthPct * 100).toFixed(0)}% below ` +
          `the $${cluster.threshold.toLocaleString()} threshold ` +
          `(avg: $${avgAmount.toLocaleString()}).`,
        affectedAwards: cluster.awardsInBand,
      });
    }

    return signals.sort((a, b) => b.value - a.value);
  }

  private getPeriodKey(dateStr: string): string {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    if (this.period === "year") return `FY${year}`;
    const quarter = Math.ceil((date.getMonth() + 1) / 3);
    return `FY${year}-Q${quarter}`;
  }

  protected getMethodology(): string {
    return (
      "Groups awards by (agency, recipient, period) and counts those falling within " +
      `${(this.bandWidthPct * 100).toFixed(0)}% below regulatory thresholds ` +
      `(${this.thresholds.map((t) => `$${t.toLocaleString()}`).join(", ")}). ` +
      "Clusters of 3+ awards in the band suggest deliberate splitting."
    );
  }

  protected getThresholds(): Record<string, number> {
    return {
      bandWidthPct: this.bandWidthPct,
      minClusterSize: this.minClusterSize,
      ...Object.fromEntries(
        this.thresholds.map((t, i) => [`threshold_${i}`, t]),
      ),
    };
  }
}
