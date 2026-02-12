/**
 * Executive briefing generator (README.md).
 * Produces a 1-page briefing: scope, key stats, top findings with dollar values,
 * what it means, and next steps.
 * Optionally includes an AI-generated narrative summary (Claude Sonnet).
 */
import Anthropic from "@anthropic-ai/sdk";
import type pino from "pino";
import type {
  InvestigationParams,
  MaterialFinding,
  ConvergenceEntity,
  QueryContext,
  Severity,
} from "../shared/types.js";

export interface BriefingInput {
  findings: MaterialFinding[];
  params: InvestigationParams;
  queryContext?: QueryContext;
  totalAwards: number;
  totalSignals: number;
  rerunCommand?: string;
  /** AI-generated executive narrative (3-5 sentences). */
  aiNarrative?: string;
  /** Map of awardId → USAspending URL for linking. */
  awardUrlMap?: Map<string, string>;
  /** Entities flagged by 2+ independent indicators. */
  convergenceEntities?: ConvergenceEntity[];
  /** Whether the --deep investigative agent was run. */
  hasDeepInvestigation?: boolean;
}

/**
 * Generate an AI executive narrative summary using Claude Sonnet.
 * Returns undefined if AI is unavailable or --no-ai is set.
 */
export async function generateAiNarrative(
  findings: MaterialFinding[],
  params: InvestigationParams,
  totalAwards: number,
  totalSignals: number,
  options: { aiEnabled: boolean; logger: pino.Logger },
): Promise<string | undefined> {
  if (!options.aiEnabled || findings.length === 0) {
    return undefined;
  }

  let client: Anthropic;
  try {
    client = new Anthropic();
  } catch {
    options.logger.warn("AI client initialization failed, skipping narrative summary");
    return undefined;
  }

  const topFindings = findings.slice(0, 5);
  const totalExposure = findings.reduce((sum, f) => sum + f.totalDollarValue, 0);
  const highCount = findings.filter((f) => f.severity === "high").length;

  const findingSummaries = topFindings
    .map((f) => {
      const fiveCsNote = f.fiveCs ? ` — ${f.fiveCs.condition}` : "";
      return `- [${f.severity.toUpperCase()}] ${f.indicatorName} for ${f.entityName}: ${f.affectedAwardIds.length} awards, $${f.totalDollarValue.toLocaleString()}${fiveCsNote}`;
    })
    .join("\n");

  const agencyLabel = params.subtierAgency ?? params.agency ?? "All Agencies";
  const recipientLabel = params.recipient ? ` → ${params.recipient}` : "";

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 384,
      system:
        "You are a procurement integrity analyst writing a concise executive narrative. " +
        "Rules:\n" +
        "1. NEVER use words like corrupt, fraud, guilty, criminal, or illegal.\n" +
        "2. Frame findings as patterns warranting review, not accusations.\n" +
        "3. Be specific about dollar amounts, entity names, and award counts.\n" +
        "4. Write exactly 3-5 sentences as a single paragraph.\n" +
        "5. Highlight the most interesting or unusual patterns.\n" +
        "6. Note this is a screening, not a conclusion.",
      messages: [
        {
          role: "user",
          content:
            `Procurement screening: ${agencyLabel}${recipientLabel}\n` +
            `Period: ${params.periodStart} to ${params.periodEnd}\n` +
            `Total awards analyzed: ${totalAwards.toLocaleString()}\n` +
            `Total signals: ${totalSignals.toLocaleString()}\n` +
            `Material findings: ${findings.length} (${highCount} high severity)\n` +
            `Total dollar exposure: $${totalExposure.toLocaleString()}\n\n` +
            `Top findings:\n${findingSummaries}\n\n` +
            `Generate a 3-5 sentence executive narrative summarizing this procurement screening. ` +
            `Be specific about dollar amounts and entity names. Maintain non-accusatory tone throughout.`,
        },
      ],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    if (!text) return undefined;

    options.logger.info("AI executive narrative generated for briefing");
    return text;
  } catch (err) {
    options.logger.warn(
      { error: (err as Error).message },
      "AI narrative generation failed, using template-only briefing",
    );
    return undefined;
  }
}

/**
 * Generate a concise executive briefing in Markdown.
 */
export function generateBriefing(input: BriefingInput): string {
  const { findings, params, queryContext, totalAwards, totalSignals, aiNarrative, awardUrlMap, convergenceEntities } = input;
  const lines: string[] = [];

  // ─── Title ─────────────────────────────────────────────────────────────
  const agencyLabel = params.subtierAgency ?? params.agency ?? "All Agencies";
  const title = params.recipient
    ? `${agencyLabel} → ${params.recipient}`
    : agencyLabel !== "All Agencies" ? agencyLabel : "Investigation";

  lines.push(`# Procurement Investigation: ${title}`);
  lines.push("");
  lines.push(`**Period:** ${params.periodStart} to ${params.periodEnd}`);
  lines.push(`**Generated:** ${new Date().toISOString().slice(0, 10)}`);
  lines.push("");

  // ─── AI Narrative Summary ──────────────────────────────────────────────
  if (aiNarrative) {
    lines.push(aiNarrative);
    lines.push("");
    lines.push("*`[AI-GENERATED]` — narrative produced by Claude Sonnet*");
    lines.push("");
  }

  // ─── Disclaimer ────────────────────────────────────────────────────────
  lines.push("> Red flags are screening indicators, **not proof of wrongdoing**.");
  lines.push("> See case.md for full methodology and data quality notes.");
  lines.push("");

  // ─── Key Stats ─────────────────────────────────────────────────────────
  lines.push("## At a Glance");
  lines.push("");
  lines.push(`| Metric | Value |`);
  lines.push(`|--------|-------|`);
  lines.push(`| Awards Analyzed | ${totalAwards.toLocaleString()} |`);
  lines.push(`| Signals Detected | ${totalSignals.toLocaleString()} |`);
  lines.push(`| Material Findings | ${findings.length} |`);

  if (findings.length > 0) {
    const totalExposure = findings.reduce((sum, f) => sum + f.totalDollarValue, 0);
    const highCount = findings.filter((f) => f.severity === "high").length;
    lines.push(`| High Severity Findings | ${highCount} |`);
    lines.push(`| Total Dollar Exposure | $${totalExposure.toLocaleString()} |`);
  }

  lines.push("");

  // ─── Multi-Signal Entities (Convergence) ──────────────────────────────
  if (convergenceEntities && convergenceEntities.length > 0) {
    lines.push("## Multi-Signal Entities");
    lines.push("");
    lines.push("Entities flagged by **2+ independent indicators** — these are the strongest investigative leads:");
    lines.push("");
    lines.push("| Entity | Indicators | Exposure | Findings |");
    lines.push("|--------|-----------|----------|----------|");
    for (const ce of convergenceEntities.slice(0, 5)) {
      const indicators = ce.indicators.join(", ");
      const exposure = `$${ce.totalExposure.toLocaleString()}`;
      lines.push(`| ${ce.entityName} | ${indicators} | ${exposure} | ${ce.findings.length} |`);
    }
    lines.push("");
  }

  // ─── Top Findings ──────────────────────────────────────────────────────
  if (findings.length > 0) {
    const topFindings = findings.slice(0, 5);
    lines.push("## Top Findings");
    lines.push("");

    for (const finding of topFindings) {
      const severityIcon = severityLabel(finding.severity);
      lines.push(
        `### ${severityIcon} ${finding.indicatorName} — ${finding.entityName}`,
      );
      lines.push("");

      if (finding.fiveCs) {
        lines.push(`**What:** ${finding.fiveCs.condition}`);
        lines.push("");
        lines.push(`**Standard:** ${finding.fiveCs.criteria}`);
        lines.push("");
        lines.push(`**Impact:** ${finding.fiveCs.effect}`);
        lines.push("");
      } else {
        lines.push(finding.signals[0]?.context ?? "");
        lines.push("");
      }

      // Entity context metadata
      if (finding.entityContext) {
        const ctx = finding.entityContext;
        const contextParts: string[] = [];
        if (ctx.naicsDescription) contextParts.push(`Industry: ${ctx.naicsDescription}`);
        if (ctx.setAsideType) contextParts.push(`Set-aside: ${ctx.setAsideType}`);
        contextParts.push(`${ctx.totalAwardsInDataset} ${ctx.totalAwardsInDataset === 1 ? "award" : "awards"} in dataset`);
        if (ctx.firstAwardDate && ctx.lastAwardDate) {
          contextParts.push(`active ${ctx.firstAwardDate} to ${ctx.lastAwardDate}`);
        }
        lines.push(`*${contextParts.join(" · ")}*`);
        lines.push("");
      }

      // Award count + value with USAspending links
      const awardLinks = formatAwardLinks(finding.affectedAwardIds, awardUrlMap);
      lines.push(
        `*${finding.affectedAwardIds.length} ${finding.affectedAwardIds.length === 1 ? "award" : "awards"}, ` +
        `$${finding.totalDollarValue.toLocaleString()} total value*`,
      );
      if (awardLinks) {
        lines.push("");
        lines.push(awardLinks);
      }

      // AI tag
      if (finding.aiTag) {
        lines.push(`\`[${finding.aiTag}]\``);
      }
      lines.push("");
    }
  } else {
    lines.push("## Findings");
    lines.push("");
    lines.push("No material findings exceeded the configured thresholds.");
    lines.push("");
  }

  // ─── Next Steps ────────────────────────────────────────────────────────
  lines.push("## Next Steps");
  lines.push("");
  lines.push(generateNextSteps(findings, params, queryContext, input.hasDeepInvestigation));
  lines.push("");

  // ─── Files in this folder ──────────────────────────────────────────────
  lines.push("## Files in This Case Folder");
  lines.push("");
  lines.push("| File | Description |");
  lines.push("|------|-------------|");
  lines.push("| `case.md` | Full investigation report with all signals and hypotheses |");
  lines.push("| `dashboard.html` | Interactive HTML dashboard with charts |");
  lines.push("| `evidence/` | CSV evidence tables and SVG charts |");
  lines.push("| `data/` | Raw JSON data files (awards, signals, hypotheses) |");
  lines.push("| `provenance.json` | Run metadata and audit trail |");
  lines.push("");

  lines.push("---");
  lines.push("*Generated by [Procurement Investigator](https://github.com/) (Investigation-as-Code)*");

  return lines.join("\n");
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function severityLabel(severity: Severity): string {
  switch (severity) {
    case "high": return "[HIGH]";
    case "medium": return "[MEDIUM]";
    case "low": return "[LOW]";
  }
}

/**
 * Format a short list of USAspending links for up to 3 award IDs.
 * Returns undefined if no URL map is provided.
 */
function formatAwardLinks(
  awardIds: string[],
  urlMap?: Map<string, string>,
): string | undefined {
  if (!urlMap || urlMap.size === 0) return undefined;

  const linkedIds = awardIds
    .slice(0, 3)
    .map((id) => {
      const url = urlMap.get(id);
      return url ? `[${id}](${url})` : id;
    });

  const suffix = awardIds.length > 3 ? `, and ${awardIds.length - 3} more` : "";
  return `Awards: ${linkedIds.join(", ")}${suffix}`;
}

function generateNextSteps(
  findings: MaterialFinding[],
  params: InvestigationParams,
  queryContext?: QueryContext,
  hasDeepInvestigation?: boolean,
): string {
  const steps: string[] = [];

  // Per-finding next steps
  const indicatorActions: Record<string, string> = {
    R001: "Review solicitation practices and advertisement reach for single-bid awards",
    R002: "Verify sole-source justifications (J&A documents) for top non-competitive awards",
    R003: "Examine whether near-threshold awards represent split requirements",
    R004: "Check SAM.gov entity type (FFRDC/UARC) and assess vendor diversification",
    R005: "Review modification history and compare original vs. current scope",
    R006: "Compare prices with similar procurements from other agencies",
  };

  const seenIndicators = new Set<string>();
  for (const finding of findings.slice(0, 5)) {
    if (!seenIndicators.has(finding.indicatorId)) {
      seenIndicators.add(finding.indicatorId);
      const action = indicatorActions[finding.indicatorId];
      if (action) {
        steps.push(`- **${finding.indicatorId}:** ${action}`);
      }
    }
  }

  // Suggest scope adjustments
  if (queryContext?.isRecipientFiltered) {
    steps.push(`- Run without \`--recipient\` to see the full agency portfolio`);
  }
  if (!queryContext?.isRecipientFiltered && params.agency) {
    steps.push(`- Add \`--recipient\` to focus on a specific entity`);
  }

  // Deep investigation (only suggest if not already run)
  if (!hasDeepInvestigation) {
    steps.push(`- Run with \`--deep\` to enable Opus 4.6 investigative agent`);
  }

  if (steps.length === 0) {
    return "No specific follow-up actions identified. The dataset appears within normal parameters.";
  }

  return steps.join("\n");
}
