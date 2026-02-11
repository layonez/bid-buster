/**
 * USAspending URL utilities.
 * Generates links to award pages on usaspending.gov from internal IDs.
 */
import type { NormalizedAward } from "../normalizer/schema.js";

const USASPENDING_AWARD_BASE = "https://www.usaspending.gov/award";

/**
 * Build a USAspending award page URL from an internal (generated) ID.
 */
export function buildAwardUrl(internalId: string): string {
  return `${USASPENDING_AWARD_BASE}/${internalId}`;
}

/**
 * Build a Map<awardId, USAspending URL> from an array of normalized awards.
 */
export function buildAwardUrlMap(awards: NormalizedAward[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const award of awards) {
    if (award.internalId) {
      map.set(award.awardId, buildAwardUrl(award.internalId));
    }
  }
  return map;
}
