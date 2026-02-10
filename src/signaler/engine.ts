/**
 * Signal computation engine.
 * Orchestrates indicator execution across the dataset.
 */
import type { NormalizedAward, Transaction } from "../normalizer/schema.js";
import type { AppConfig } from "../cli/config.js";
import type { Indicator, SignalEngineResult } from "./types.js";
import { SingleBidIndicator } from "./indicators/single-bid.js";
import { NonCompetitiveIndicator } from "./indicators/non-competitive.js";
import { SplittingIndicator } from "./indicators/splitting.js";
import { ConcentrationIndicator } from "./indicators/concentration.js";
import { ModificationsIndicator } from "./indicators/modifications.js";
import { PriceOutliersIndicator } from "./indicators/price-outliers.js";

/**
 * Registry of all available indicators.
 */
function createIndicatorRegistry(): Map<string, () => Indicator> {
  const registry = new Map<string, () => Indicator>();
  registry.set("R001", () => new SingleBidIndicator());
  registry.set("R002", () => new NonCompetitiveIndicator());
  registry.set("R003", () => new SplittingIndicator());
  registry.set("R004", () => new ConcentrationIndicator());
  registry.set("R005", () => new ModificationsIndicator());
  registry.set("R006", () => new PriceOutliersIndicator());
  return registry;
}

/**
 * Map config keys to indicator IDs.
 */
const CONFIG_KEY_TO_ID: Record<string, string> = {
  R001_single_bid: "R001",
  R002_non_competitive: "R002",
  R003_splitting: "R003",
  R004_concentration: "R004",
  R005_modifications: "R005",
  R006_price_outliers: "R006",
};

export class SignalEngine {
  private indicators: Indicator[] = [];

  /**
   * Initialize indicators from config. Only enabled indicators are loaded.
   */
  initialize(config: AppConfig, indicatorFilter?: string[]): void {
    const registry = createIndicatorRegistry();

    for (const [configKey, indicatorId] of Object.entries(CONFIG_KEY_TO_ID)) {
      // Apply filter if specified
      if (indicatorFilter && !indicatorFilter.includes(indicatorId)) continue;

      const settings =
        config.signals[configKey as keyof typeof config.signals];
      if (!settings?.enabled) continue;

      const factory = registry.get(indicatorId);
      if (!factory) continue;

      const indicator = factory();
      indicator.configure(settings);
      this.indicators.push(indicator);
    }
  }

  /**
   * Process all awards through all indicators (fold phase).
   */
  processAwards(awards: NormalizedAward[]): void {
    for (const award of awards) {
      for (const indicator of this.indicators) {
        indicator.fold(award);
      }
    }
  }

  /**
   * Process transaction data for indicators that need it.
   */
  processTransactions(
    transactionsByAward: Map<string, Transaction[]>,
  ): void {
    for (const indicator of this.indicators) {
      if (!indicator.foldTransactions) continue;
      for (const [awardId, transactions] of transactionsByAward) {
        indicator.foldTransactions(awardId, transactions);
      }
    }
  }

  /**
   * Finalize all indicators and collect results.
   */
  finalize(): SignalEngineResult {
    const allSignals = [];
    const allMetadata = [];

    for (const indicator of this.indicators) {
      const signals = indicator.finalize();
      allSignals.push(...signals);
      allMetadata.push(indicator.getMetadata());
    }

    // Sort by severity (high first), then by value
    const severityOrder = { high: 0, medium: 1, low: 2 };
    allSignals.sort(
      (a, b) =>
        severityOrder[a.severity] - severityOrder[b.severity] ||
        b.value - a.value,
    );

    const signalsBySeverity: Record<string, number> = {};
    const signalsByIndicator: Record<string, number> = {};

    for (const signal of allSignals) {
      signalsBySeverity[signal.severity] =
        (signalsBySeverity[signal.severity] ?? 0) + 1;
      signalsByIndicator[signal.indicatorId] =
        (signalsByIndicator[signal.indicatorId] ?? 0) + 1;
    }

    return {
      signals: allSignals,
      metadata: allMetadata,
      summary: {
        totalIndicatorsRun: this.indicators.length,
        totalSignals: allSignals.length,
        signalsBySeverity,
        signalsByIndicator,
      },
    };
  }
}
