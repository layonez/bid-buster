/**
 * Types for the signal computation engine.
 * Indicator interface inspired by Cardinal-rs Calculate trait:
 *   configure → fold (per-record) → finalize (produce signals)
 */
import type { NormalizedAward, Transaction } from "../normalizer/schema.js";
import type { Signal, QueryContext } from "../shared/types.js";

// ─── Indicator Configuration ─────────────────────────────────────────────────

export interface IndicatorConfig {
  enabled: boolean;
  [key: string]: unknown;
}

export interface IndicatorMetadata {
  id: string;
  name: string;
  description: string;
  methodology: string;
  thresholdsUsed: Record<string, number>;
  dataCoverage: {
    totalRecords: number;
    recordsWithRequiredFields: number;
    coveragePercent: number;
  };
}

// ─── Indicator Interface ─────────────────────────────────────────────────────

export interface Indicator {
  /** Unique identifier, e.g. "R001" */
  readonly id: string;

  /** Human-readable name, e.g. "Single-Bid Competition" */
  readonly name: string;

  /** Description of what this indicator detects */
  readonly description: string;

  /** Configure the indicator with settings from config */
  configure(settings: IndicatorConfig): void;

  /** Process a single award record (accumulate state) */
  fold(award: NormalizedAward): void;

  /**
   * Process transaction data for modification-based indicators.
   * Optional -- only indicators that need transaction data implement this.
   */
  foldTransactions?(awardId: string, transactions: Transaction[]): void;

  /** Finalize computation and produce signals */
  finalize(): Signal[];

  /** Receive query context so indicators can adapt to active filters */
  setQueryContext?(context: QueryContext): void;

  /** Return metadata about this indicator run for transparency */
  getMetadata(): IndicatorMetadata;
}

// ─── Signal Engine Types ─────────────────────────────────────────────────────

export interface SignalEngineResult {
  signals: Signal[];
  metadata: IndicatorMetadata[];
  summary: {
    totalIndicatorsRun: number;
    totalSignals: number;
    signalsBySeverity: Record<string, number>;
    signalsByIndicator: Record<string, number>;
  };
}
