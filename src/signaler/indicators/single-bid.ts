/**
 * R001: Single-Bid Competition
 *
 * Flags competitively-solicited awards that received only one bid.
 * A high rate of single-bid awards suggests restricted competition.
 *
 * Methodology: OCP Red Flags Guide, EU Single Market Scoreboard
 * Threshold: >20% single-bid rate = high severity (EU benchmark)
 */
import type { NormalizedAward } from "../../normalizer/schema.js";
import type { Signal } from "../../shared/types.js";
import type { IndicatorConfig } from "../types.js";
import { BaseIndicator } from "./base.js";

const COMPETITIVE_CODES = new Set(["A", "CDO", "D", "E", "F"]);

interface AgencyStats {
  totalCompeted: number;
  singleBid: number;
  singleBidAwards: string[];
}

export class SingleBidIndicator extends BaseIndicator {
  readonly id = "R001";
  readonly name = "Single-Bid Competition";
  readonly description =
    "Flags competitively-solicited contracts that received only one bid";

  private severityThreshold = 0.2;
  private requireCompetitiveType = true;
  private byAgency = new Map<string, AgencyStats>();

  configure(settings: IndicatorConfig): void {
    if (typeof settings.severityThreshold === "number") {
      this.severityThreshold = settings.severityThreshold;
    }
    if (typeof settings.requireCompetitiveType === "boolean") {
      this.requireCompetitiveType = settings.requireCompetitiveType;
    }
  }

  fold(award: NormalizedAward): void {
    this.totalRecords++;

    // Need competition data
    if (award.numberOfOffersReceived == null || !award.extentCompeted) {
      return;
    }

    this.recordsWithRequiredFields++;

    // Only count competitively-solicited awards
    if (
      this.requireCompetitiveType &&
      !COMPETITIVE_CODES.has(award.extentCompeted)
    ) {
      return;
    }

    const agency = award.awardingAgency;
    if (!this.byAgency.has(agency)) {
      this.byAgency.set(agency, {
        totalCompeted: 0,
        singleBid: 0,
        singleBidAwards: [],
      });
    }

    const stats = this.byAgency.get(agency)!;
    stats.totalCompeted++;

    // Coerce to number: API may return string "1" instead of number 1
    if (Number(award.numberOfOffersReceived) === 1) {
      stats.singleBid++;
      stats.singleBidAwards.push(award.awardId);
    }
  }

  finalize(): Signal[] {
    const signals: Signal[] = [];

    for (const [agency, stats] of this.byAgency) {
      if (stats.totalCompeted === 0) continue;

      const rate = stats.singleBid / stats.totalCompeted;

      if (stats.singleBid > 0) {
        signals.push({
          indicatorId: this.id,
          indicatorName: this.name,
          severity:
            rate >= this.severityThreshold
              ? "high"
              : rate >= this.severityThreshold / 2
                ? "medium"
                : "low",
          entityType: "agency",
          entityId: agency,
          entityName: agency,
          value: Math.round(rate * 1000) / 10,
          threshold: this.severityThreshold * 100,
          context:
            `${stats.singleBid} of ${stats.totalCompeted} competitively-solicited contracts ` +
            `(${(rate * 100).toFixed(1)}%) received only one bid. ` +
            `EU benchmark considers >20% as high-risk.`,
          affectedAwards: stats.singleBidAwards,
        });
      }
    }

    return signals.sort((a, b) => b.value - a.value);
  }

  protected getMethodology(): string {
    return (
      "Counts competitively-solicited contracts where number_of_offers_received = 1. " +
      "Based on OCP Red Flags Guide and EU Single Market Scoreboard methodology."
    );
  }

  protected getThresholds(): Record<string, number> {
    return {
      severityThreshold: this.severityThreshold,
    };
  }
}
