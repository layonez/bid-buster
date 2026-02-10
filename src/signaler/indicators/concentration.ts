/**
 * R004: Vendor Concentration (Dominant Supplier)
 *
 * Flags when a single supplier wins a disproportionate share of
 * an agency's contract value.
 *
 * Methodology: EU Single Market Scoreboard, Herfindahl-Hirschman Index
 */
import type { NormalizedAward } from "../../normalizer/schema.js";
import type { Signal } from "../../shared/types.js";
import type { IndicatorConfig } from "../types.js";
import { BaseIndicator } from "./base.js";

interface AgencySpend {
  totalAmount: number;
  byRecipient: Map<
    string,
    { amount: number; count: number; awards: string[] }
  >;
}

export class ConcentrationIndicator extends BaseIndicator {
  readonly id = "R004";
  readonly name = "Vendor Concentration";
  readonly description =
    "Flags when a single supplier dominates an agency's spending";

  private vendorShareThreshold = 0.3;
  private spikeThreshold = 0.15;
  private byAgency = new Map<string, AgencySpend>();

  configure(settings: IndicatorConfig): void {
    if (typeof settings.vendorShareThreshold === "number") {
      this.vendorShareThreshold = settings.vendorShareThreshold;
    }
    if (typeof settings.spikeThreshold === "number") {
      this.spikeThreshold = settings.spikeThreshold;
    }
  }

  fold(award: NormalizedAward): void {
    this.totalRecords++;
    if (award.awardAmount <= 0) return;
    this.recordsWithRequiredFields++;

    const agency = award.awardingAgency;
    if (!this.byAgency.has(agency)) {
      this.byAgency.set(agency, {
        totalAmount: 0,
        byRecipient: new Map(),
      });
    }

    const agencySpend = this.byAgency.get(agency)!;
    agencySpend.totalAmount += award.awardAmount;

    const recipient = award.recipientName;
    if (!agencySpend.byRecipient.has(recipient)) {
      agencySpend.byRecipient.set(recipient, {
        amount: 0,
        count: 0,
        awards: [],
      });
    }

    const recipientSpend = agencySpend.byRecipient.get(recipient)!;
    recipientSpend.amount += award.awardAmount;
    recipientSpend.count++;
    recipientSpend.awards.push(award.awardId);
  }

  finalize(): Signal[] {
    const signals: Signal[] = [];

    for (const [agency, agencySpend] of this.byAgency) {
      if (agencySpend.totalAmount === 0) continue;

      for (const [recipient, recipientSpend] of agencySpend.byRecipient) {
        const share = recipientSpend.amount / agencySpend.totalAmount;

        if (share >= this.vendorShareThreshold) {
          signals.push({
            indicatorId: this.id,
            indicatorName: this.name,
            severity:
              share >= 0.6
                ? "high"
                : share >= this.vendorShareThreshold
                  ? "medium"
                  : "low",
            entityType: "recipient",
            entityId: recipient,
            entityName: recipient,
            value: Math.round(share * 1000) / 10,
            threshold: this.vendorShareThreshold * 100,
            context:
              `${recipient} received ${(share * 100).toFixed(1)}% ` +
              `($${recipientSpend.amount.toLocaleString()}) of ${agency}'s ` +
              `total contract value ($${agencySpend.totalAmount.toLocaleString()}) ` +
              `across ${recipientSpend.count} awards.`,
            affectedAwards: recipientSpend.awards,
          });
        }
      }
    }

    return signals.sort((a, b) => b.value - a.value);
  }

  protected getMethodology(): string {
    return (
      "Computes each vendor's share of agency contract spend. " +
      `Flags vendors with >${(this.vendorShareThreshold * 100).toFixed(0)}% share. ` +
      "Based on EU Single Market Scoreboard concentration benchmarks."
    );
  }

  protected getThresholds(): Record<string, number> {
    return {
      vendorShareThreshold: this.vendorShareThreshold,
      spikeThreshold: this.spikeThreshold,
    };
  }
}
