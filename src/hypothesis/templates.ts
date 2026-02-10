/**
 * Non-accusatory hypothesis templates mapped to each indicator.
 * Language follows OECD guidance: emphasis on possibility, not guilt.
 */
import type { Signal, Hypothesis } from "../shared/types.js";

type TemplateMap = Record<string, (signal: Signal) => Hypothesis>;

const templates: TemplateMap = {
  R001: (signal) => ({
    id: `H-${signal.indicatorId}-${signal.entityId.slice(0, 8)}`,
    signalIds: [signal.indicatorId],
    question: `Are contract opportunities from ${signal.entityName} reaching a sufficiently broad supplier base?`,
    context:
      `${signal.context} ` +
      `Single-bid competitions can result from legitimate specialisation, ` +
      `but persistent patterns may indicate that requirements are too narrowly defined ` +
      `or insufficiently advertised (OECD 2025).`,
    evidenceNeeded: [
      "Distribution of offers received across all competed awards",
      "Year-over-year trend of single-bid rate",
      "Comparison with other agencies in same category",
    ],
    severity: signal.severity,
  }),

  R002: (signal) => ({
    id: `H-${signal.indicatorId}-${signal.entityId.slice(0, 8)}`,
    signalIds: [signal.indicatorId],
    question: `Does the pattern of non-competitive awards to ${signal.entityName} warrant closer examination?`,
    context:
      `${signal.context} ` +
      `Non-competed awards may be justified (e.g., unique capabilities, national security), ` +
      `but high rates across a portfolio can indicate over-reliance on sole-source mechanisms ` +
      `or insufficient market research (OECD 2025).`,
    evidenceNeeded: [
      "Breakdown of non-competed awards by justification code",
      "Dollar distribution of competed vs non-competed awards",
      "Comparison of non-competitive rate with agency average",
    ],
    severity: signal.severity,
  }),

  R003: (signal) => ({
    id: `H-${signal.indicatorId}-${signal.entityId.slice(0, 8)}`,
    signalIds: [signal.indicatorId],
    question: `Are there patterns in award sizing that suggest deliberate structuring near the $${signal.threshold.toLocaleString()} threshold?`,
    context:
      `${signal.context} ` +
      `Clustering of awards just below regulatory thresholds may indicate contract splitting ` +
      `to avoid competition requirements, though it could also reflect standard project scoping.`,
    evidenceNeeded: [
      "Distribution of award amounts with threshold bands highlighted",
      "Timeline of near-threshold awards",
      "Same-recipient award frequency analysis",
    ],
    severity: signal.severity,
  }),

  R004: (signal) => ({
    id: `H-${signal.indicatorId}-${signal.entityId.slice(0, 8)}`,
    signalIds: [signal.indicatorId],
    question: `Is the concentration of spending on ${signal.entityName} consistent with market conditions and procurement requirements?`,
    context:
      `${signal.context} ` +
      `High vendor concentration may reflect legitimate specialisation or market structure, ` +
      `but can also indicate insufficient competition or vendor lock-in. ` +
      `The EU Single Market Scoreboard tracks this as a key procurement health indicator.`,
    evidenceNeeded: [
      "Vendor share breakdown for the agency",
      "Year-over-year trend of vendor concentration",
      "Comparison with similar agencies or categories",
    ],
    severity: signal.severity,
  }),

  R005: (signal) => ({
    id: `H-${signal.indicatorId}-${signal.entityId.slice(0, 8)}`,
    signalIds: [signal.indicatorId],
    question: `Have the terms of contract ${signal.entityId} changed substantially from what was originally competed?`,
    context:
      `${signal.context} ` +
      `Excessive modifications can indicate scope creep, poor initial planning, ` +
      `or deliberate under-scoping to win at a lower bid with subsequent expansion. ` +
      `The OECD notes excessive post-award amendments as a procurement integrity risk.`,
    evidenceNeeded: [
      "Timeline of modifications with dollar amounts",
      "Comparison of original vs current contract value",
      "Modification breakdown by type (funding, scope, admin)",
    ],
    severity: signal.severity,
  }),

  R006: (signal) => ({
    id: `H-${signal.indicatorId}-${signal.entityId.slice(0, 8)}`,
    signalIds: [signal.indicatorId],
    question: `Is the award amount for ${signal.entityId} unusual relative to comparable procurements in the same category?`,
    context:
      `${signal.context} ` +
      `Price outliers may reflect unique project scope, emergency procurement premiums, ` +
      `or legitimate cost drivers. However, persistent overpricing relative to peers ` +
      `can indicate insufficient competition or pricing irregularities.`,
    evidenceNeeded: [
      "Distribution of award amounts in the same NAICS/PSC category",
      "Details of the flagged award (description, scope, duration)",
      "Comparison with similar awards from other agencies",
    ],
    severity: signal.severity,
  }),
};

/**
 * Generate hypotheses from signals using templates.
 */
export function generateHypothesesFromTemplates(signals: Signal[]): Hypothesis[] {
  const hypotheses: Hypothesis[] = [];
  const seen = new Set<string>();

  for (const signal of signals) {
    const template = templates[signal.indicatorId];
    if (!template) continue;

    const hypothesis = template(signal);
    if (seen.has(hypothesis.id)) continue;
    seen.add(hypothesis.id);

    hypotheses.push(hypothesis);
  }

  return hypotheses;
}
