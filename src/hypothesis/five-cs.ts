/**
 * Five C's (GAO Yellow Book) finding structure generator.
 * Maps each indicator to Condition, Criteria, Cause, Effect, Recommendation.
 *
 * The Five C's framework (Condition, Criteria, Cause, Effect, Recommendation)
 * is the gold standard for government audit findings per GAO Yellow Book.
 */
import type { Signal, FiveCsStructure } from "../shared/types.js";
import type { NormalizedAward } from "../normalizer/schema.js";

// ─── Helpers ────────────────────────────────────────────────────────────────

function pluralAward(n: number): string {
  return n === 1 ? "award" : "awards";
}

// ─── Per-Indicator Templates ────────────────────────────────────────────────

interface FiveCsTemplate {
  condition: (signal: Signal, stats: EntityStats) => string;
  criteria: string;
  cause: (signal: Signal) => string;
  effect: (signal: Signal, stats: EntityStats) => string;
  recommendation: string;
}

interface EntityStats {
  awardCount: number;
  totalAmount: number;
}

const TEMPLATES: Record<string, FiveCsTemplate> = {
  R001: {
    condition: (s, stats) =>
      `${s.entityName} received ${stats.awardCount} competitively solicited ${pluralAward(stats.awardCount)}, ` +
      `with a single-bid rate of ${s.value.toFixed(1)}% ` +
      `(${Math.round((s.value / 100) * stats.awardCount)} ${pluralAward(Math.round((s.value / 100) * stats.awardCount))} received only one offer).`,
    criteria:
      "FAR 6.101 requires agencies to promote and provide for full and open competition. " +
      "The EU Single Market Scoreboard flags single-bid rates above 20% as a concern indicator.",
    cause: (s) =>
      `Possible contributing factors include narrowly defined requirements, ` +
      `insufficient advertisement reach, or legitimate market specialisation. ` +
      `The pattern warrants review to determine the root cause.`,
    effect: (s, stats) =>
      `$${stats.totalAmount.toLocaleString()} in awards may not have benefited from competitive pricing pressure. ` +
      `Without multiple bidders, there is reduced assurance that the government received best value.`,
    recommendation:
      "Review solicitation practices for the flagged awards. Examine whether requirements can be " +
      "broadened, advertisement improved, or set-aside categories adjusted to attract more bidders.",
  },

  R002: {
    condition: (s, stats) =>
      `${s.value.toFixed(1)}% of ${stats.awardCount === 1 ? "the award" : "awards"} (by count) to ${s.entityName} ${stats.awardCount === 1 ? "was" : "were"} non-competitive, ` +
      `totaling $${stats.totalAmount.toLocaleString()} across ${stats.awardCount} ${pluralAward(stats.awardCount)}.`,
    criteria:
      "FAR 6.302 permits non-competitive procurement only under specific circumstances " +
      "(sole source, urgency, national security). OECD Guidelines (2025) flag persistent " +
      "non-competitive patterns as a procurement integrity indicator.",
    cause: (s) =>
      `Non-competitive awards may reflect unique capabilities (e.g., FFRDC, UARC status), ` +
      `legitimate sole-source justifications, or habitual use of non-competitive mechanisms ` +
      `without adequate market research.`,
    effect: (s, stats) =>
      `$${stats.totalAmount.toLocaleString()} in awards bypassed competition. ` +
      `While individual justifications may be valid, the cumulative pattern reduces ` +
      `the transparency and competitiveness of the procurement portfolio.`,
    recommendation:
      "Verify sole-source justifications (J&A documentation) for the largest non-competitive awards. " +
      "Check entity type via SAM.gov (FFRDC/UARC status may explain the pattern). " +
      "Consider whether market research could identify additional qualified sources.",
  },

  R003: {
    condition: (s, stats) =>
      `${stats.awardCount} ${pluralAward(stats.awardCount)} to ${s.entityName} were valued within 10% below the ` +
      `$${s.threshold.toLocaleString()} threshold, suggesting possible structuring.`,
    criteria:
      "FAR 13.003 (Simplified Acquisition Threshold at $250,000) and other regulatory " +
      "thresholds require additional oversight above certain dollar amounts. OCP Red Flags " +
      "Guide (2024) identifies clustering below thresholds as a splitting indicator.",
    cause: () =>
      `Award values near thresholds may reflect standard project scoping, natural cost distributions, ` +
      `or deliberate structuring to avoid oversight requirements. Further analysis of timing ` +
      `and related awards is needed.`,
    effect: (s, stats) =>
      `$${stats.totalAmount.toLocaleString()} in awards may have avoided enhanced competition or ` +
      `oversight requirements that apply above the $${s.threshold.toLocaleString()} threshold.`,
    recommendation:
      "Examine whether the near-threshold awards are for related work that could have been " +
      "combined. Review timing and same-recipient patterns. Check if the same work was " +
      "split across multiple awards to stay below the threshold.",
  },

  R004: {
    condition: (s, stats) =>
      `${s.entityName} received ${s.value.toFixed(1)}% of total spending, ` +
      `totaling $${stats.totalAmount.toLocaleString()} across ${stats.awardCount} ${pluralAward(stats.awardCount)}.`,
    criteria:
      "The EU Single Market Scoreboard tracks vendor concentration as a key procurement health " +
      "indicator. Vendor shares exceeding 30% warrant review for market diversity. " +
      "FAR 6.101 promotes full and open competition to prevent vendor lock-in.",
    cause: (s) =>
      `High concentration may reflect legitimate specialisation, unique capabilities, ` +
      `market structure (limited qualified suppliers), or insufficient effort to diversify ` +
      `the vendor base.`,
    effect: (s, stats) =>
      `Concentration of $${stats.totalAmount.toLocaleString()} with one vendor creates ` +
      `dependency risk and reduces competitive pricing leverage. ` +
      `Disruption to this vendor could significantly impact operations.`,
    recommendation:
      "Verify entity type via SAM.gov (FFRDC/UARC status may explain concentration). " +
      "Assess whether vendor diversification programs are in place. " +
      "Review comparable procurements from other agencies for benchmark concentration levels.",
  },

  R005: {
    condition: (s, stats) =>
      `Contract ${s.entityId} has undergone ${s.value} modifications, ` +
      `with a total value of $${stats.totalAmount.toLocaleString()}.`,
    criteria:
      "FAR 43 governs contract modifications. OECD Guidelines (2025) identify excessive " +
      "post-award amendments as a procurement integrity risk, particularly when they " +
      "substantially change scope or value from what was originally competed.",
    cause: () =>
      `Excessive modifications may result from poor initial planning, scope creep, ` +
      `evolving requirements, or deliberate under-scoping to win at a lower bid ` +
      `with subsequent expansion. Individual modifications may be justified.`,
    effect: (s, stats) =>
      `${s.value} modifications to a single contract suggest the final deliverable ` +
      `may differ significantly from what was originally competed, potentially ` +
      `undermining the purpose of the initial competition.`,
    recommendation:
      "Review modification history: categorize by type (funding, scope, admin). " +
      "Compare original vs. current scope and value. " +
      "Assess whether the modifications should have been competed separately.",
  },

  R006: {
    condition: (s, stats) =>
      `Award ${s.entityId} valued at $${stats.totalAmount.toLocaleString()} is a statistical outlier ` +
      `(z-score: ${s.value.toFixed(2)}) within its NAICS/PSC category.`,
    criteria:
      "Statistical pricing analysis per OECD bid rigging guidelines. Awards exceeding " +
      "1.5x IQR above Q3 or z-score > 2.0 are flagged for price reasonableness review. " +
      "FAR 15.404 requires price analysis for contract actions.",
    cause: () =>
      `Price outliers may reflect unique project scope, emergency procurement premiums, ` +
      `specialized requirements, or insufficient competition leading to higher prices.`,
    effect: (s, stats) =>
      `An award valued significantly above comparable procurements may indicate ` +
      `insufficient price negotiation or lack of competitive pricing pressure. ` +
      `Total exposure: $${stats.totalAmount.toLocaleString()}.`,
    recommendation:
      "Review price analysis documentation. Compare with similar awards from other agencies. " +
      "Examine competition method and number of offers. " +
      "Verify whether the scope justifies the premium over comparable awards.",
  },
};

// ─── Generator ───────────────────────────────────────────────────────────────

/**
 * Generate a Five C's structure for a signal, using per-indicator templates
 * and entity-level statistics from the awards dataset.
 */
export function generateFiveCs(
  signal: Signal,
  awards: NormalizedAward[],
): FiveCsStructure {
  const template = TEMPLATES[signal.indicatorId];
  if (!template) {
    return {
      condition: signal.context,
      criteria: "Standard procurement integrity methodology (OECD, OCP).",
      cause: "Requires further investigation to determine root cause.",
      effect: "Potential impact on procurement integrity and value for money.",
      recommendation: "Review the flagged pattern and underlying data for context.",
    };
  }

  // Compute entity-level stats from affected awards
  const affectedSet = new Set(signal.affectedAwards);
  const entityAwards = awards.filter(
    (a) => affectedSet.has(a.awardId) || affectedSet.has(a.internalId),
  );
  const stats: EntityStats = {
    awardCount: entityAwards.length || signal.affectedAwards.length,
    totalAmount: entityAwards.reduce((sum, a) => sum + a.awardAmount, 0),
  };

  return {
    condition: template.condition(signal, stats),
    criteria: template.criteria,
    cause: template.cause(signal),
    effect: template.effect(signal, stats),
    recommendation: template.recommendation,
  };
}
