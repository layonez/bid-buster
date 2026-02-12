/**
 * R004: Vendor Concentration (Dominant Supplier)
 *
 * Flags when a single supplier wins a disproportionate share of
 * an agency's contract value. Analyzes at three levels:
 * 1. Toptier agency
 * 2. Sub-agency (when different from toptier)
 * 3. NAICS sector within the agency (market-level concentration)
 *
 * Methodology: EU Single Market Scoreboard, Herfindahl-Hirschman Index
 */
import type { NormalizedAward } from "../../normalizer/schema.js";
import type { Signal } from "../../shared/types.js";
import type { IndicatorConfig } from "../types.js";
import { BaseIndicator } from "./base.js";

interface SpendGroup {
  totalAmount: number;
  byRecipient: Map<
    string,
    { amount: number; count: number; awards: string[] }
  >;
}

/** Minimum total spend in a NAICS sector to be considered for concentration analysis */
const MIN_NAICS_SPEND = 1_000_000;
/** Minimum awards in a NAICS sector to avoid flagging trivially small groups */
const MIN_NAICS_AWARDS = 3;

export class ConcentrationIndicator extends BaseIndicator {
  readonly id = "R004";
  readonly name = "Vendor Concentration";
  readonly description =
    "Flags when a single supplier dominates an agency's spending";

  private vendorShareThreshold = 0.3;
  private spikeThreshold = 0.15;
  private byAgency = new Map<string, SpendGroup>();
  private bySubAgency = new Map<string, SpendGroup>();
  private byNaics = new Map<string, SpendGroup & { naicsDescription: string; awardCount: number }>();

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
    this.accumulateSpend(this.byAgency, agency, award);

    // Also track at sub-agency level for finer-grained concentration
    if (award.awardingSubAgency && award.awardingSubAgency !== agency) {
      this.accumulateSpend(this.bySubAgency, award.awardingSubAgency, award);
    }

    // Track NAICS sector-level concentration
    if (award.naicsCode) {
      const naicsKey = award.naicsCode;
      if (!this.byNaics.has(naicsKey)) {
        this.byNaics.set(naicsKey, {
          totalAmount: 0,
          byRecipient: new Map(),
          naicsDescription: award.naicsDescription ?? award.naicsCode,
          awardCount: 0,
        });
      }
      const naicsGroup = this.byNaics.get(naicsKey)!;
      naicsGroup.awardCount++;
      this.accumulateSpend(this.byNaics as Map<string, SpendGroup>, naicsKey, award);
    }
  }

  private accumulateSpend(
    map: Map<string, SpendGroup>,
    key: string,
    award: NormalizedAward,
  ): void {
    if (!map.has(key)) {
      map.set(key, { totalAmount: 0, byRecipient: new Map() });
    }

    const group = map.get(key)!;
    group.totalAmount += award.awardAmount;

    const recipient = award.recipientName;
    if (!group.byRecipient.has(recipient)) {
      group.byRecipient.set(recipient, {
        amount: 0,
        count: 0,
        awards: [],
      });
    }

    const recipientSpend = group.byRecipient.get(recipient)!;
    recipientSpend.amount += award.awardAmount;
    recipientSpend.count++;
    recipientSpend.awards.push(award.awardId);
  }

  finalize(): Signal[] {
    const signals: Signal[] = [];
    const seen = new Set<string>();

    // Check toptier agency concentration first
    this.findAgencyConcentration(this.byAgency, signals, seen, false);

    // Then check sub-agency concentration (only for entities not already flagged)
    this.findAgencyConcentration(this.bySubAgency, signals, seen, true);

    // Finally check NAICS sector concentration (top signals only, deduplicated)
    this.findNaicsConcentration(signals, seen);

    return signals.sort((a, b) => b.value - a.value);
  }

  private isRecipientTautological(recipient: string): boolean {
    return !!(
      this.queryContext?.isRecipientFiltered &&
      this.queryContext.recipientFilter &&
      recipient.toUpperCase().includes(this.queryContext.recipientFilter.toUpperCase())
    );
  }

  private findAgencyConcentration(
    agencyMap: Map<string, SpendGroup>,
    signals: Signal[],
    seen: Set<string>,
    isSubAgency: boolean,
  ): void {
    for (const [agency, agencySpend] of agencyMap) {
      if (agencySpend.totalAmount === 0) continue;

      for (const [recipient, recipientSpend] of agencySpend.byRecipient) {
        const share = recipientSpend.amount / agencySpend.totalAmount;

        if (share >= this.vendorShareThreshold) {
          if (this.isRecipientTautological(recipient)) continue;

          const dedupeKey = recipient;
          if (seen.has(dedupeKey)) continue;
          seen.add(dedupeKey);

          const agencyLabel = isSubAgency ? `${agency} (sub-agency)` : agency;

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
              `($${recipientSpend.amount.toLocaleString()}) of ${agencyLabel}'s ` +
              `total contract value ($${agencySpend.totalAmount.toLocaleString()}) ` +
              `across ${recipientSpend.count} ${recipientSpend.count === 1 ? "award" : "awards"}.`,
            affectedAwards: recipientSpend.awards,
          });
        }
      }
    }
  }

  private findNaicsConcentration(
    signals: Signal[],
    seen: Set<string>,
  ): void {
    // Collect NAICS sectors where a vendor dominates, then pick top signals
    const naicsSignals: Signal[] = [];

    for (const [, naicsGroup] of this.byNaics) {
      const group = naicsGroup as SpendGroup & { naicsDescription: string; awardCount: number };
      if (group.totalAmount < MIN_NAICS_SPEND) continue;
      if (group.awardCount < MIN_NAICS_AWARDS) continue;

      for (const [recipient, recipientSpend] of group.byRecipient) {
        const share = recipientSpend.amount / group.totalAmount;

        if (share >= this.vendorShareThreshold) {
          if (this.isRecipientTautological(recipient)) continue;
          if (seen.has(recipient)) continue;

          naicsSignals.push({
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
              `($${recipientSpend.amount.toLocaleString()}) of spending in ` +
              `${group.naicsDescription} sector ` +
              `($${group.totalAmount.toLocaleString()} across ${group.awardCount} ${group.awardCount === 1 ? "award" : "awards"}).`,
            affectedAwards: recipientSpend.awards,
          });
        }
      }
    }

    // Sort by dollar amount (value * threshold gives approx), take top signals
    // Limit NAICS signals to avoid overwhelming the report with sector-level noise
    naicsSignals.sort((a, b) => b.value - a.value);
    const maxNaicsSignals = 10;
    for (const signal of naicsSignals.slice(0, maxNaicsSignals)) {
      seen.add(signal.entityId);
      signals.push(signal);
    }
  }

  protected getMethodology(): string {
    return (
      "Computes each vendor's share of contract spend at agency, sub-agency, " +
      "and NAICS sector levels. " +
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
