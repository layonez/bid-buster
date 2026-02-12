/**
 * Opus 4.6 autonomous investigative agent.
 * Examines procurement red-flag signals, decides what to investigate,
 * fetches enrichment data via tool calls, and produces contextual findings.
 *
 * Design:
 * - Agentic loop: system prompt → model response → tool execution → repeat
 * - Stops on: end_turn, max iterations, or budget exceeded
 * - Graceful degradation: if API fails, returns empty findings
 * - Full audit trail: every tool call is logged with provenance
 */
import Anthropic from "@anthropic-ai/sdk";
import type pino from "pino";
import { mean, median, quantile, standardDeviation } from "simple-statistics";
import type { Signal, InvestigationFindings, EnrichedHypothesis, CrossReference, ToolCallRecord, Hypothesis, InvestigationStep, MaterialFinding } from "../shared/types.js";
import type { NormalizedAward } from "../normalizer/schema.js";
import type { SamGovClient } from "../enrichment/sam-gov.js";
import type { SubAwardsClient } from "../enrichment/subawards.js";
import type { OpenSanctionsClient } from "../enrichment/open-sanctions.js";
import type { USAspendingClient } from "../collector/usaspending.js";
import {
  TOOL_DEFINITIONS,
  TOOL_NAMES,
  executeToolCall,
  type ToolExecutorMap,
  type VerifyEntityInput,
  type ScreenSanctionsInput,
  type FetchSubawardsInput,
  type FetchComparableAwardsInput,
  type AnalyzeStatisticalPatternInput,
  type LookupAwardDetailInput,
  type LogReasoningInput,
  type CreateFindingInput,
  type VerifyEntityOutput,
  type ScreenSanctionsOutput,
  type FetchSubawardsOutput,
  type FetchComparableAwardsOutput,
  type AnalyzeStatisticalPatternOutput,
  type LookupAwardDetailOutput,
  type LogReasoningOutput,
  type CreateFindingOutput,
} from "./tools.js";

// ─── Configuration ──────────────────────────────────────────────────────────

export interface InvestigatorConfig {
  enabled: boolean;
  model: string;
  maxIterations: number;
  maxTokensPerTurn: number;
  maxCostUsd: number;
  toolChoice: "auto" | "any" | "none";
}

export interface InvestigatorDeps {
  samGovClient?: SamGovClient;
  openSanctionsClient?: OpenSanctionsClient;
  subAwardsClient?: SubAwardsClient;
  usaspendingClient?: USAspendingClient;
}

export interface InvestigatorInput {
  signals: Signal[];
  hypotheses: Hypothesis[];
  awards: NormalizedAward[];
  materialFindings?: MaterialFinding[];
  config: InvestigatorConfig;
  deps: InvestigatorDeps;
  logger: pino.Logger;
}

// ─── Cost Tracking ──────────────────────────────────────────────────────────

// Approximate pricing for Opus 4.6 (per million tokens)
const PRICING = {
  inputPerMillion: 15.0,
  outputPerMillion: 75.0,
} as const;

function estimateCost(inputTokens: number, outputTokens: number): number {
  return (
    (inputTokens / 1_000_000) * PRICING.inputPerMillion +
    (outputTokens / 1_000_000) * PRICING.outputPerMillion
  );
}

// ─── System Prompt ──────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an autonomous procurement integrity analyst conducting an in-depth investigation of red-flag signals detected in public procurement data.

## Your Mission
Examine each signal, gather additional context from external sources, cross-reference findings, and produce a thorough but fair assessment. Your investigation should help auditors understand what these patterns mean and whether they warrant further review.

## Investigation Tools
You have access to tools for:
- **Entity verification** (SAM.gov): Check contractor registration, entity type (FFRDC, small business, etc.), parent companies, and exclusion/debarment status
- **Sanctions screening** (OpenSanctions): Screen entities against international sanctions, PEP, and debarment lists
- **Sub-award data**: Examine pass-through arrangements under prime contracts
- **Comparable awards**: Find similar awards from other agencies/recipients for benchmarking
- **Statistical analysis**: Run deeper statistical analysis on the award dataset
- **Award details**: Get full details on specific awards
- **Reasoning log**: Record your analytical thought process at each step (REQUIRED — call before and after each investigation step)
- **Create finding**: Formally document a material finding using the Five C's framework (Condition, Criteria, Cause, Effect, Recommendation)

## Investigation Strategy
1. **Log your initial reasoning** — call log_reasoning with phase "hypothesis" to record your initial assessment of the signals
2. For key entities, verify their SAM.gov registration to understand entity type and status
3. Fetch comparable awards to establish baselines (is this pattern normal for this sector?)
4. Use statistical analysis to quantify patterns more precisely
5. Check sub-awards for large contracts to understand pass-through patterns
6. Screen high-risk entities against sanctions lists
7. Cross-reference findings: does entity type explain the competition pattern? Do sub-awards show diversification?
8. **Create findings** — for each material pattern, call create_finding with the Five C's
9. **Log your synthesis** — call log_reasoning with phase "synthesis" to summarize your overall assessment

## Critical Rules
1. **Non-accusatory language**: NEVER use words like "corrupt", "fraud", "guilty", "criminal", or "illegal"
2. **Cite every source**: Reference specific data points, tool results, and signal values
3. **Explain innocent alternatives**: For every risk interpretation, provide at least one plausible innocent explanation
4. **Be specific**: Use actual numbers, percentages, entity names, and award IDs
5. **Data quality awareness**: Note coverage limitations and missing data

## Output Format
After completing your investigation, provide your findings as a JSON block wrapped in \`\`\`json ... \`\`\` tags with this structure:
{
  "enrichedHypotheses": [
    {
      "hypothesisId": "H-R002-ENTITY",
      "originalQuestion": "...",
      "enrichedContext": "Detailed investigation findings...",
      "innocentExplanations": ["Explanation 1", "Explanation 2"],
      "additionalEvidence": ["Evidence point 1", "Evidence point 2"],
      "confidenceAdjustment": "increased|decreased|unchanged",
      "reasoning": "Why confidence changed..."
    }
  ],
  "crossReferences": [
    {
      "sourceA": "SAM.gov entity data",
      "sourceB": "Competition signal R002",
      "finding": "Entity is classified as FFRDC, which typically receives sole-source funding",
      "impact": "confirms|refutes|contextualizes",
      "affectedHypotheses": ["H-R002-ENTITY"]
    }
  ],
  "summary": "Overall assessment of findings..."
}`;

// ─── Prompt Building ────────────────────────────────────────────────────────

function buildInitialPrompt(
  signals: Signal[],
  hypotheses: Hypothesis[],
  awards: NormalizedAward[],
  materialFindings?: MaterialFinding[],
): string {
  const totalAmount = awards.reduce((sum, a) => sum + a.awardAmount, 0);
  const uniqueRecipients = new Set(awards.map((a) => a.recipientName)).size;
  const uniqueAgencies = new Set(awards.map((a) => a.awardingAgency)).size;
  const dateRange = awards.length > 0
    ? `${awards.map((a) => a.startDate).sort()[0]} to ${awards.map((a) => a.startDate).sort().pop()}`
    : "unknown";

  const awardSummary =
    `## Dataset Summary\n` +
    `- **Total awards**: ${awards.length}\n` +
    `- **Total value**: $${totalAmount.toLocaleString()}\n` +
    `- **Unique recipients**: ${uniqueRecipients}\n` +
    `- **Unique agencies**: ${uniqueAgencies}\n` +
    `- **Date range**: ${dateRange}\n`;

  const topRecipients = getTopRecipients(awards, 10);
  const recipientSection =
    `## Top Recipients by Award Value\n` +
    topRecipients
      .map(
        (r, i) =>
          `${i + 1}. **${r.name}**: $${r.total.toLocaleString()} across ${r.count} awards`,
      )
      .join("\n");

  // Use material findings if available (compact), otherwise top signals
  let findingsSection: string;
  if (materialFindings && materialFindings.length > 0) {
    findingsSection =
      `## Material Findings (${materialFindings.length} prioritized from ${signals.length} raw signals)\n\n` +
      materialFindings
        .map(
          (f) =>
            `### ${f.id}: [${f.severity.toUpperCase()}] ${f.indicatorName} — ${f.entityName}\n` +
            `- **Dollar exposure**: $${f.totalDollarValue.toLocaleString()}\n` +
            `- **Signals**: ${f.signalCount} signals from indicator ${f.indicatorId}\n` +
            `- **Affected awards**: ${f.affectedAwardIds.slice(0, 5).join(", ")}${f.affectedAwardIds.length > 5 ? ` (+${f.affectedAwardIds.length - 5} more)` : ""}\n` +
            (f.fiveCs ? `- **Condition**: ${f.fiveCs.condition}\n- **Criteria**: ${f.fiveCs.criteria}\n- **Cause**: ${f.fiveCs.cause}\n- **Effect**: ${f.fiveCs.effect}\n` : "") +
            (f.entityContext ? `- **Entity context**: ${f.entityContext.naicsDescription ?? "unknown industry"}${f.entityContext.setAsideType ? `, ${f.entityContext.setAsideType}` : ""}, ${f.entityContext.totalAwardsInDataset} awards in dataset` : ""),
        )
        .join("\n\n");
  } else {
    // Fallback: top 50 signals by severity (not all 1,454)
    const severityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
    const topSignals = [...signals]
      .sort((a, b) => (severityOrder[a.severity] ?? 3) - (severityOrder[b.severity] ?? 3))
      .slice(0, 50);

    findingsSection =
      `## Top Signals (${topSignals.length} of ${signals.length} total, sorted by severity)\n\n` +
      topSignals
        .map(
          (s) =>
            `### [${s.severity.toUpperCase()}] ${s.indicatorName} (${s.indicatorId})\n` +
            `- **Entity**: ${s.entityName} (${s.entityType})\n` +
            `- **Value**: ${s.value} (threshold: ${s.threshold})\n` +
            `- **Context**: ${s.context}\n` +
            `- **Affected awards**: ${s.affectedAwards.slice(0, 3).join(", ")}${s.affectedAwards.length > 3 ? ` (+${s.affectedAwards.length - 3} more)` : ""}`,
        )
        .join("\n\n");
  }

  // Top hypotheses only (matching material findings or top 20)
  const topHypotheses = hypotheses.slice(0, 20);
  const hypothesisSection =
    `## Key Questions (${topHypotheses.length} of ${hypotheses.length} total)\n\n` +
    topHypotheses
      .map((h) => `- **${h.id}** [${h.severity}]: ${h.question}`)
      .join("\n");

  return (
    `You are investigating procurement data. Here is the context:\n\n` +
    `${awardSummary}\n` +
    `${recipientSection}\n\n` +
    `${findingsSection}\n\n` +
    `${hypothesisSection}\n\n` +
    `You have tools to drill into individual awards, verify entities via SAM.gov, ` +
    `screen against sanctions lists, fetch sub-awards, and run statistical analyses ` +
    `on the full ${awards.length}-award dataset. Use them to investigate the material findings above.\n\n` +
    `Please investigate these findings using the available tools. Focus on understanding ` +
    `context, verifying entities, and establishing baselines. After your investigation, ` +
    `provide your structured findings as described in your instructions.`
  );
}

function getTopRecipients(
  awards: NormalizedAward[],
  limit: number,
): Array<{ name: string; total: number; count: number }> {
  const recipientMap = new Map<string, { total: number; count: number }>();
  for (const award of awards) {
    const existing = recipientMap.get(award.recipientName) ?? { total: 0, count: 0 };
    existing.total += award.awardAmount;
    existing.count += 1;
    recipientMap.set(award.recipientName, existing);
  }
  return [...recipientMap.entries()]
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);
}

// ─── Tool Executor Factory ──────────────────────────────────────────────────

function buildToolExecutors(
  awards: NormalizedAward[],
  deps: InvestigatorDeps,
  logger: pino.Logger,
  reasoningSteps: InvestigationStep[],
  agentFindings: MaterialFinding[],
): ToolExecutorMap {
  return {
    [TOOL_NAMES.VERIFY_ENTITY]: async (input: VerifyEntityInput): Promise<VerifyEntityOutput> => {
      if (!deps.samGovClient) {
        throw new Error("SAM.gov client not available (API key not configured)");
      }

      const entityResult = input.uei
        ? await deps.samGovClient.lookupByUei(input.uei)
        : input.name
          ? await deps.samGovClient.searchEntity(input.name)
          : null;

      if (!entityResult) {
        throw new Error("No entity name or UEI provided, or SAM.gov lookup returned null");
      }

      const checkExclusions = input.check_exclusions !== false;
      const exclusionsResult = checkExclusions && input.name
        ? await deps.samGovClient.checkExclusions(input.name)
        : undefined;

      return {
        entity: entityResult,
        exclusions: exclusionsResult ?? undefined,
      };
    },

    [TOOL_NAMES.SCREEN_SANCTIONS]: async (input: ScreenSanctionsInput): Promise<ScreenSanctionsOutput> => {
      if (!deps.openSanctionsClient) {
        throw new Error("OpenSanctions client not available (API key not configured)");
      }

      const result = await deps.openSanctionsClient.screenEntity(
        input.name,
        input.schema ?? "Company",
      );

      if (!result) {
        throw new Error("OpenSanctions screening returned null");
      }

      return { result };
    },

    [TOOL_NAMES.FETCH_SUBAWARDS]: async (input: FetchSubawardsInput): Promise<FetchSubawardsOutput> => {
      if (!deps.subAwardsClient) {
        throw new Error("Sub-awards client not available");
      }

      const subawards = await deps.subAwardsClient.fetchSubAwards(input.award_id);
      return { subawards };
    },

    [TOOL_NAMES.FETCH_COMPARABLE_AWARDS]: async (input: FetchComparableAwardsInput): Promise<FetchComparableAwardsOutput> => {
      // Filter from in-memory awards for comparable analysis
      let comparable = [...awards];

      if (input.naics_code) {
        comparable = comparable.filter((a) => a.naicsCode === input.naics_code);
      }
      if (input.psc_code) {
        comparable = comparable.filter((a) => a.pscCode === input.psc_code);
      }
      if (input.agency) {
        comparable = comparable.filter((a) =>
          a.awardingAgency.toLowerCase().includes(input.agency!.toLowerCase()),
        );
      }
      if (input.exclude_recipient) {
        comparable = comparable.filter(
          (a) => a.recipientName.toLowerCase() !== input.exclude_recipient!.toLowerCase(),
        );
      }
      if (input.period_start) {
        comparable = comparable.filter((a) => a.startDate >= input.period_start!);
      }
      if (input.period_end) {
        comparable = comparable.filter((a) => a.startDate <= input.period_end!);
      }

      const limit = input.limit ?? 25;
      const selected = comparable.slice(0, limit);

      return {
        awards: selected.map((a) => ({
          awardId: a.awardId,
          recipientName: a.recipientName,
          agency: a.awardingAgency,
          amount: a.awardAmount,
          extentCompeted: a.extentCompeted,
          naicsCode: a.naicsCode,
        })),
        totalFound: comparable.length,
        source: "in-memory dataset",
      };
    },

    [TOOL_NAMES.ANALYZE_STATISTICAL_PATTERN]: async (input: AnalyzeStatisticalPatternInput): Promise<AnalyzeStatisticalPatternOutput> => {
      let filtered = [...awards];

      // Apply filters
      if (input.filter) {
        for (const [key, value] of Object.entries(input.filter)) {
          filtered = filtered.filter((a) => {
            const fieldVal = (a as Record<string, unknown>)[key];
            return fieldVal != null && String(fieldVal) === value;
          });
        }
      }

      const field = input.field;
      const groupBy = input.group_by;

      // Group awards
      const groups = new Map<string, NormalizedAward[]>();
      for (const award of filtered) {
        const groupKey = groupBy
          ? String((award as Record<string, unknown>)[groupBy] ?? "unknown")
          : "all";
        const existing = groups.get(groupKey) ?? [];
        existing.push(award);
        groups.set(groupKey, existing);
      }

      const results: Array<{ group: string; value: number; count: number; details?: Record<string, unknown> }> = [];

      for (const [group, groupAwards] of groups) {
        const values = groupAwards
          .map((a) => Number((a as Record<string, unknown>)[field]))
          .filter((v) => !isNaN(v));

        if (values.length === 0) {
          results.push({ group, value: 0, count: 0 });
          continue;
        }

        switch (input.method) {
          case "mean":
            results.push({ group, value: mean(values), count: values.length });
            break;
          case "median":
            results.push({ group, value: median(values), count: values.length });
            break;
          case "iqr": {
            const q1 = quantile(values, 0.25);
            const q3 = quantile(values, 0.75);
            const iqrVal = q3 - q1;
            results.push({
              group,
              value: iqrVal,
              count: values.length,
              details: { q1, q3, iqr: iqrVal, min: Math.min(...values), max: Math.max(...values) },
            });
            break;
          }
          case "zscore": {
            const m = mean(values);
            const sd = standardDeviation(values);
            const outliers = sd > 0
              ? values.filter((v) => Math.abs((v - m) / sd) > 2).length
              : 0;
            results.push({
              group,
              value: outliers,
              count: values.length,
              details: { mean: m, stdDev: sd, outlierCount: outliers },
            });
            break;
          }
          case "distribution": {
            const freq = new Map<string, number>();
            for (const v of values) {
              const key = String(v);
              freq.set(key, (freq.get(key) ?? 0) + 1);
            }
            results.push({
              group,
              value: freq.size,
              count: values.length,
              details: Object.fromEntries(freq),
            });
            break;
          }
          case "concentration": {
            const total = values.reduce((s, v) => s + v, 0);
            const shares = total > 0 ? values.map((v) => v / total) : [];
            const hhi = shares.reduce((s, sh) => s + sh * sh, 0);
            results.push({
              group,
              value: hhi,
              count: values.length,
              details: { hhi, totalValue: total, topShare: Math.max(...shares, 0) },
            });
            break;
          }
        }
      }

      const summary = `Analyzed ${filtered.length} awards, field="${field}", method="${input.method}", ${groups.size} group(s)`;

      return { field, groupBy, method: input.method, results, summary };
    },

    [TOOL_NAMES.LOOKUP_AWARD_DETAIL]: async (input: LookupAwardDetailInput): Promise<LookupAwardDetailOutput> => {
      // First try in-memory awards
      const inMemory = awards.find(
        (a) => a.internalId === input.award_id || a.awardId === input.award_id,
      );
      if (inMemory) {
        return {
          award: inMemory as unknown as Record<string, unknown>,
          source: "in-memory dataset",
        };
      }

      // Fall back to API if client available
      if (deps.usaspendingClient) {
        try {
          const detail = await deps.usaspendingClient.getAwardDetail(input.award_id);
          return { award: detail as unknown as Record<string, unknown>, source: "USAspending API" };
        } catch (err) {
          logger.warn({ awardId: input.award_id, error: (err as Error).message }, "Award detail lookup failed");
        }
      }

      return { award: null, source: "not found" };
    },

    [TOOL_NAMES.LOG_REASONING]: async (input: LogReasoningInput): Promise<LogReasoningOutput> => {
      const step: InvestigationStep = {
        timestamp: new Date().toISOString(),
        phase: input.phase,
        reasoning: input.reasoning,
        relatedSignals: input.related_signals,
        relatedEntities: input.related_entities,
      };
      reasoningSteps.push(step);
      logger.info({ phase: input.phase, stepIndex: reasoningSteps.length - 1 }, "Agent reasoning logged");
      return { logged: true, stepIndex: reasoningSteps.length - 1 };
    },

    [TOOL_NAMES.CREATE_FINDING]: async (input: CreateFindingInput): Promise<CreateFindingOutput> => {
      const findingId = `F-${input.indicator_id}-AGENT-${agentFindings.length + 1}`;
      const finding: MaterialFinding = {
        id: findingId,
        entityName: input.entity_name,
        indicatorId: input.indicator_id,
        indicatorName: input.indicator_name,
        severity: input.severity,
        materialityScore: 0, // Agent findings are scored separately
        totalDollarValue: 0,
        signalCount: 0,
        affectedAwardIds: input.affected_award_ids,
        signals: [],
        fiveCs: {
          condition: input.condition,
          criteria: input.criteria,
          cause: input.cause,
          effect: input.effect,
          recommendation: input.recommendation,
        },
        source: "investigator_agent",
        aiTag: "AI-DISCOVERED",
      };
      agentFindings.push(finding);
      logger.info({ findingId, entity: input.entity_name }, "Agent created finding");
      return { created: true, findingId };
    },
  };
}

// ─── Response Parsing ───────────────────────────────────────────────────────

function parseFindings(text: string, hypotheses: Hypothesis[]): {
  enrichedHypotheses: EnrichedHypothesis[];
  crossReferences: CrossReference[];
  summary: string;
} {
  // Try to extract JSON block from the response
  const jsonMatch = text.match(/```json\s*([\s\S]*?)```/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[1]);
      return {
        enrichedHypotheses: Array.isArray(parsed.enrichedHypotheses) ? parsed.enrichedHypotheses : [],
        crossReferences: Array.isArray(parsed.crossReferences) ? parsed.crossReferences : [],
        summary: typeof parsed.summary === "string" ? parsed.summary : "",
      };
    } catch {
      // Fall through to text-based extraction
    }
  }

  // Fallback: use the text as summary and create enriched hypotheses from existing ones
  return {
    enrichedHypotheses: hypotheses.map((h) => ({
      hypothesisId: h.id,
      originalQuestion: h.question,
      enrichedContext: text.slice(0, 500),
      innocentExplanations: [],
      additionalEvidence: [],
      confidenceAdjustment: "unchanged" as const,
      reasoning: "Agent response did not include structured JSON output",
    })),
    crossReferences: [],
    summary: text.slice(0, 1000),
  };
}

// ─── Main Agent Loop ────────────────────────────────────────────────────────

/**
 * Run the autonomous investigative agent.
 * Returns structured findings with full audit trail.
 * Gracefully returns empty findings if Claude API is unavailable.
 */
export async function runInvestigativeAgent(input: InvestigatorInput): Promise<InvestigationFindings> {
  const { signals, hypotheses, awards, materialFindings, config, deps, logger } = input;

  const emptyFindings: InvestigationFindings = {
    enrichedHypotheses: [],
    crossReferences: [],
    toolCallLog: [],
    iterations: 0,
    estimatedCostUsd: 0,
    summary: "",
  };

  if (!config.enabled || signals.length === 0) {
    logger.info("Investigation skipped (disabled or no signals)");
    return emptyFindings;
  }

  // Initialize Anthropic client
  let client: Anthropic;
  try {
    client = new Anthropic();
  } catch {
    logger.warn("Anthropic client initialization failed, skipping investigation");
    return emptyFindings;
  }

  // Build tool executors with mutable state containers
  const reasoningSteps: InvestigationStep[] = [];
  const agentFindings: MaterialFinding[] = [];
  const executors = buildToolExecutors(awards, deps, logger, reasoningSteps, agentFindings);

  // Build initial prompt
  const initialPrompt = buildInitialPrompt(signals, hypotheses, awards, materialFindings);

  // Initialize conversation
  const messages: Anthropic.Messages.MessageParam[] = [
    { role: "user", content: initialPrompt },
  ];

  const toolCallLog: ToolCallRecord[] = [];
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let iterations = 0;

  logger.info(
    { maxIterations: config.maxIterations, maxCostUsd: config.maxCostUsd, model: config.model },
    "Starting investigative agent",
  );

  // ─── Agent loop ──────────────────────────────────────────────────────

  while (iterations < config.maxIterations) {
    iterations++;

    let response: Anthropic.Messages.Message;
    try {
      response = await client.messages.create({
        model: config.model,
        max_tokens: config.maxTokensPerTurn,
        system: SYSTEM_PROMPT,
        tools: TOOL_DEFINITIONS,
        tool_choice: { type: config.toolChoice },
        messages,
      });
    } catch (err) {
      logger.error(
        { error: (err as Error).message, iteration: iterations },
        "Claude API call failed",
      );
      break;
    }

    // Track token usage
    totalInputTokens += response.usage?.input_tokens ?? 0;
    totalOutputTokens += response.usage?.output_tokens ?? 0;

    const currentCost = estimateCost(totalInputTokens, totalOutputTokens);
    logger.info(
      {
        iteration: iterations,
        stopReason: response.stop_reason,
        inputTokens: response.usage?.input_tokens,
        outputTokens: response.usage?.output_tokens,
        totalCostUsd: currentCost.toFixed(4),
      },
      "Agent iteration complete",
    );

    // Check cost budget
    if (currentCost > config.maxCostUsd) {
      logger.warn(
        { currentCost: currentCost.toFixed(4), maxCostUsd: config.maxCostUsd },
        "Cost budget exceeded, stopping investigation",
      );
      break;
    }

    // If the model is done (end_turn or max_tokens), extract findings
    if (response.stop_reason !== "tool_use") {
      // Extract text from the final response
      const textBlocks = response.content.filter(
        (b): b is Anthropic.Messages.TextBlock => b.type === "text",
      );
      const fullText = textBlocks.map((b) => b.text).join("\n");

      const findings = parseFindings(fullText, hypotheses);

      return {
        ...findings,
        toolCallLog,
        iterations,
        estimatedCostUsd: currentCost,
        reasoningSteps: reasoningSteps.length > 0 ? reasoningSteps : undefined,
        agentFindings: agentFindings.length > 0 ? agentFindings : undefined,
      };
    }

    // ─── Handle tool calls ──────────────────────────────────────────

    // Append the assistant's response to conversation
    messages.push({ role: "assistant", content: response.content });

    // Collect tool results
    const toolResults: Anthropic.Messages.ToolResultBlockParam[] = [];

    for (const block of response.content) {
      if (block.type !== "tool_use") continue;

      logger.info(
        { tool: block.name, input: JSON.stringify(block.input).slice(0, 200) },
        "Executing tool call",
      );

      try {
        const { result, record } = await executeToolCall(
          block.name,
          block.input as Record<string, unknown>,
          executors,
        );
        toolCallLog.push(record);

        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: JSON.stringify(result),
        });
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        logger.warn(
          { tool: block.name, error: errorMsg },
          "Tool execution failed",
        );

        toolCallLog.push({
          toolName: block.name,
          input: block.input as Record<string, unknown>,
          output: { error: errorMsg },
          durationMs: 0,
          cacheHit: false,
          timestamp: new Date().toISOString(),
          error: errorMsg,
        });

        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: JSON.stringify({ error: errorMsg }),
          is_error: true,
        });
      }
    }

    // Append tool results as user message
    messages.push({ role: "user", content: toolResults });
  }

  // If we hit max iterations without a final response
  logger.warn(
    { iterations, maxIterations: config.maxIterations },
    "Investigation reached max iterations without final response",
  );

  const totalCost = estimateCost(totalInputTokens, totalOutputTokens);

  return {
    enrichedHypotheses: hypotheses.map((h) => ({
      hypothesisId: h.id,
      originalQuestion: h.question,
      enrichedContext: "Investigation reached maximum iterations without final assessment",
      innocentExplanations: [],
      additionalEvidence: [],
      confidenceAdjustment: "unchanged" as const,
      reasoning: "Max iterations reached",
    })),
    crossReferences: [],
    toolCallLog,
    iterations,
    estimatedCostUsd: totalCost,
    summary: `Investigation completed after ${iterations} iterations (max iterations reached). ${toolCallLog.length} tool calls executed.`,
    reasoningSteps: reasoningSteps.length > 0 ? reasoningSteps : undefined,
    agentFindings: agentFindings.length > 0 ? agentFindings : undefined,
  };
}
