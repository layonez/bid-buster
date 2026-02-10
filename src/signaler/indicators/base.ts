/**
 * Base class for red-flag indicators.
 * Inspired by Cardinal-rs Calculate trait: configure → fold → finalize.
 */
import type { NormalizedAward, Transaction } from "../../normalizer/schema.js";
import type { Signal } from "../../shared/types.js";
import type {
  Indicator,
  IndicatorConfig,
  IndicatorMetadata,
} from "../types.js";

export abstract class BaseIndicator implements Indicator {
  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly description: string;

  protected totalRecords = 0;
  protected recordsWithRequiredFields = 0;

  configure(_settings: IndicatorConfig): void {
    // Override in subclasses to apply settings
  }

  abstract fold(award: NormalizedAward): void;

  foldTransactions?(_awardId: string, _transactions: Transaction[]): void;

  abstract finalize(): Signal[];

  getMetadata(): IndicatorMetadata {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      methodology: this.getMethodology(),
      thresholdsUsed: this.getThresholds(),
      dataCoverage: {
        totalRecords: this.totalRecords,
        recordsWithRequiredFields: this.recordsWithRequiredFields,
        coveragePercent:
          this.totalRecords > 0
            ? (this.recordsWithRequiredFields / this.totalRecords) * 100
            : 0,
      },
    };
  }

  protected abstract getMethodology(): string;
  protected abstract getThresholds(): Record<string, number>;
}
