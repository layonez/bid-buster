/**
 * Signal consolidation and materiality filtering.
 * Groups raw signals by (entity, indicator), computes dollar-weighted materiality,
 * filters by thresholds, and returns the top-N material findings.
 *
 * Professional auditors distinguish: observation -> flag -> finding -> material finding.
 * This implements that escalation ladder:
 *   materialityScore = totalDollarValue * severityWeight * signalCount
 */
import type { Signal, MaterialFinding, MaterialityConfig, Severity } from "../shared/types.js";
import type { NormalizedAward } from "../normalizer/schema.js";
import { generateFiveCs } from "../hypothesis/five-cs.js";

// ─── Severity Weights ────────────────────────────────────────────────────────

const SEVERITY_WEIGHTS: Record<Severity, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

// ─── Default Config ──────────────────────────────────────────────────────────

const DEFAULT_MATERIALITY_CONFIG: MaterialityConfig = {
  minAwardCount: 1,
  minTotalAmount: 0,
  maxFindings: 20,
};

// ─── Consolidation ──────────────────────────────────────────────────────────

/**
 * Consolidate raw signals into material findings.
 * Groups signals by (entityName, indicatorId), computes dollar-weighted materiality,
 * filters by min thresholds, sorts by score, and returns top-N.
 */
export function consolidateSignals(
  signals: Signal[],
  awards: NormalizedAward[],
  config?: Partial<MaterialityConfig>,
): MaterialFinding[] {
  const cfg = { ...DEFAULT_MATERIALITY_CONFIG, ...config };

  // Build award lookup by ID for dollar values
  const awardMap = new Map<string, NormalizedAward>();
  for (const award of awards) {
    awardMap.set(award.awardId, award);
    if (award.internalId) {
      awardMap.set(award.internalId, award);
    }
  }

  // Group signals by (entityName, indicatorId)
  const groupKey = (s: Signal) => `${s.entityName}|||${s.indicatorId}`;
  const groups = new Map<string, Signal[]>();

  for (const signal of signals) {
    const key = groupKey(signal);
    const existing = groups.get(key) ?? [];
    existing.push(signal);
    groups.set(key, existing);
  }

  // Convert each group into a MaterialFinding
  const findings: MaterialFinding[] = [];

  for (const [, groupSignals] of groups) {
    const first = groupSignals[0];

    // Collect unique affected award IDs
    const affectedAwardIds = [
      ...new Set(groupSignals.flatMap((s) => s.affectedAwards)),
    ];

    // Compute total dollar value from awards
    const totalDollarValue = affectedAwardIds.reduce((sum, id) => {
      const award = awardMap.get(id);
      return sum + (award?.awardAmount ?? 0);
    }, 0);

    // Use the highest severity from the group
    const severity = groupSignals.reduce<Severity>((max, s) => {
      return SEVERITY_WEIGHTS[s.severity] > SEVERITY_WEIGHTS[max]
        ? s.severity
        : max;
    }, "low");

    const signalCount = groupSignals.length;
    const severityWeight = SEVERITY_WEIGHTS[severity];

    // materialityScore = totalDollarValue * severityWeight * signalCount
    // Normalize to avoid overflow: use log scale for dollar values > 1M
    const dollarFactor =
      totalDollarValue > 1_000_000
        ? Math.log10(totalDollarValue) * 1_000_000
        : totalDollarValue;
    const materialityScore = dollarFactor * severityWeight * signalCount;

    // Apply min thresholds
    if (affectedAwardIds.length < cfg.minAwardCount) continue;
    if (totalDollarValue < cfg.minTotalAmount) continue;

    const findingId = `F-${first.indicatorId}-${first.entityId.slice(0, 12)}`;

    // Generate Five C's structure from the primary signal
    const fiveCs = generateFiveCs(first, awards);

    findings.push({
      id: findingId,
      entityName: first.entityName,
      indicatorId: first.indicatorId,
      indicatorName: first.indicatorName,
      severity,
      materialityScore,
      totalDollarValue,
      signalCount,
      affectedAwardIds,
      signals: groupSignals,
      fiveCs,
      source: "signal_consolidation",
      aiTag: "RULE",
    });
  }

  // Sort by materiality score descending and take top-N
  findings.sort((a, b) => b.materialityScore - a.materialityScore);
  return findings.slice(0, cfg.maxFindings);
}
