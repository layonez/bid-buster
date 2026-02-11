/**
 * Signal consolidation and materiality filtering.
 * Groups raw signals by (entity, indicator), computes dollar-weighted materiality,
 * filters by thresholds, and returns the top-N material findings.
 *
 * Professional auditors distinguish: observation -> flag -> finding -> material finding.
 * This implements that escalation ladder:
 *   materialityScore = totalDollarValue * severityWeight * signalCount
 */
import type { Signal, MaterialFinding, MaterialityConfig, Severity, EntityContext, ConvergenceEntity } from "../shared/types.js";
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
  maxPerIndicator: 5,
};

// ─── Indicator Short Names (for slug IDs) ────────────────────────────────────

const INDICATOR_SUFFIXES: Record<string, string> = {
  R001: "SINGLEBID",
  R002: "NONCOMP",
  R003: "SPLITTING",
  R004: "CONCENTRATION",
  R005: "MODS",
  R006: "OUTLIER",
};

// ─── Finding ID Slugification ────────────────────────────────────────────────

/**
 * Generate a meaningful, readable finding ID.
 * Target: F-R003-DOD-SPLITTING, F-R002-ADV-ELEC-NONCOMP
 */
export function slugifyFindingId(
  indicatorId: string,
  entityName: string,
  existingIds: Set<string>,
): string {
  // Clean entity name: uppercase, keep only alphanumeric + spaces, then split into words
  const cleaned = entityName
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, "")
    .trim();
  const words = cleaned.split(/\s+/).filter(Boolean);

  // Take first 2 words (or abbreviations from them), max 10 chars total
  let entitySlug: string;
  if (words.length === 0) {
    entitySlug = "UNKNOWN";
  } else if (words.length === 1) {
    entitySlug = words[0].slice(0, 10);
  } else {
    // Use first 2 words, truncated to fit within 10 chars
    const first = words[0].slice(0, 5);
    const second = words[1].slice(0, 5);
    entitySlug = `${first}-${second}`;
    if (entitySlug.length > 12) {
      entitySlug = entitySlug.slice(0, 12);
    }
  }

  const suffix = INDICATOR_SUFFIXES[indicatorId] ?? indicatorId;
  let id = `F-${indicatorId}-${entitySlug}-${suffix}`;

  // Ensure uniqueness
  if (existingIds.has(id)) {
    let counter = 2;
    while (existingIds.has(`${id}-${counter}`)) {
      counter++;
    }
    id = `${id}-${counter}`;
  }

  existingIds.add(id);
  return id;
}

// ─── Entity Context Builder ─────────────────────────────────────────────────

/**
 * Build entity context metadata from matching awards.
 */
function buildEntityContext(
  entityName: string,
  affectedAwardIds: string[],
  awardMap: Map<string, NormalizedAward>,
  allAwards: NormalizedAward[],
): EntityContext {
  // Count total awards for this entity across the whole dataset
  const totalAwardsInDataset = allAwards.filter(
    (a) => a.recipientName === entityName,
  ).length;

  // Get affected awards for metadata extraction
  const affectedAwards = affectedAwardIds
    .map((id) => awardMap.get(id))
    .filter((a): a is NormalizedAward => a !== undefined);

  // NAICS description: use the most common one from affected awards
  const naicsCounts = new Map<string, number>();
  for (const a of affectedAwards) {
    if (a.naicsDescription) {
      naicsCounts.set(a.naicsDescription, (naicsCounts.get(a.naicsDescription) ?? 0) + 1);
    }
  }
  let naicsDescription: string | undefined;
  if (naicsCounts.size > 0) {
    naicsDescription = [...naicsCounts.entries()].sort((a, b) => b[1] - a[1])[0][0];
  }

  // Set-aside type: most common from affected awards
  const setAsideCounts = new Map<string, number>();
  for (const a of affectedAwards) {
    if (a.typeSetAside) {
      setAsideCounts.set(a.typeSetAside, (setAsideCounts.get(a.typeSetAside) ?? 0) + 1);
    }
  }
  let setAsideType: string | undefined;
  if (setAsideCounts.size > 0) {
    setAsideType = [...setAsideCounts.entries()].sort((a, b) => b[1] - a[1])[0][0];
  }

  // Date range from all awards to this entity
  const entityAwards = allAwards.filter((a) => a.recipientName === entityName);
  const dates = entityAwards
    .map((a) => a.startDate)
    .filter(Boolean)
    .sort();

  return {
    naicsDescription,
    setAsideType,
    totalAwardsInDataset,
    firstAwardDate: dates[0],
    lastAwardDate: dates[dates.length - 1],
  };
}

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
  const existingIds = new Set<string>();

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

    const findingId = slugifyFindingId(first.indicatorId, first.entityName, existingIds);

    // Generate Five C's structure from the primary signal
    const fiveCs = generateFiveCs(first, awards);

    // Build entity context from award metadata
    const entityContext = buildEntityContext(
      first.entityName,
      affectedAwardIds,
      awardMap,
      awards,
    );

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
      entityContext,
    });
  }

  // Sort by materiality score descending
  findings.sort((a, b) => b.materialityScore - a.materialityScore);

  // Enforce per-indicator diversity cap: no single indicator monopolizes results
  const indicatorCounts = new Map<string, number>();
  const diverseFindings: MaterialFinding[] = [];

  for (const finding of findings) {
    const count = indicatorCounts.get(finding.indicatorId) ?? 0;
    if (count >= cfg.maxPerIndicator) continue;
    indicatorCounts.set(finding.indicatorId, count + 1);
    diverseFindings.push(finding);
    if (diverseFindings.length >= cfg.maxFindings) break;
  }

  return diverseFindings;
}

// ─── Convergence Analysis ───────────────────────────────────────────────────

/**
 * Identify entities flagged by 2+ independent indicators.
 * When R001 + R002 + R006 all flag the same vendor, that's a real lead.
 * convergenceScore = indicators.length * sum(finding.materialityScore)
 */
export function computeConvergence(
  findings: MaterialFinding[],
): ConvergenceEntity[] {
  // Group findings by entity name
  const entityGroups = new Map<string, MaterialFinding[]>();
  for (const finding of findings) {
    const existing = entityGroups.get(finding.entityName) ?? [];
    existing.push(finding);
    entityGroups.set(finding.entityName, existing);
  }

  const convergenceEntities: ConvergenceEntity[] = [];

  for (const [entityName, entityFindings] of entityGroups) {
    // Get unique indicator IDs
    const indicators = [...new Set(entityFindings.map((f) => f.indicatorId))];

    // Only include entities with 2+ distinct indicators
    if (indicators.length < 2) continue;

    const totalExposure = entityFindings.reduce(
      (sum, f) => sum + f.totalDollarValue,
      0,
    );
    const materialitySum = entityFindings.reduce(
      (sum, f) => sum + f.materialityScore,
      0,
    );
    const convergenceScore = indicators.length * materialitySum;

    convergenceEntities.push({
      entityName,
      indicators: indicators.sort(),
      totalExposure,
      convergenceScore,
      findings: entityFindings,
    });
  }

  // Sort by convergence score descending
  convergenceEntities.sort((a, b) => b.convergenceScore - a.convergenceScore);

  return convergenceEntities;
}
