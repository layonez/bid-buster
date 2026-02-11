/**
 * Investigator tool definitions for the Opus 4.6 autonomous agent.
 * Defines tool schemas (Anthropic SDK format) and executor dispatcher.
 *
 * Each tool maps to an enrichment client or in-memory computation.
 * Actual enrichment calls are wired during agent construction.
 */
import type Anthropic from "@anthropic-ai/sdk";
import type { ToolCallRecord } from "../shared/types.js";
import type {
  EntityVerificationResult,
  ExclusionCheckResult,
  SanctionsScreeningResult,
  SubAwardResult,
} from "../enrichment/types.js";

// ─── Tool Names ─────────────────────────────────────────────────────────────

export const TOOL_NAMES = {
  VERIFY_ENTITY: "verify_entity",
  SCREEN_SANCTIONS: "screen_sanctions",
  FETCH_SUBAWARDS: "fetch_subawards",
  FETCH_COMPARABLE_AWARDS: "fetch_comparable_awards",
  ANALYZE_STATISTICAL_PATTERN: "analyze_statistical_pattern",
  LOOKUP_AWARD_DETAIL: "lookup_award_detail",
} as const;

export type ToolName = (typeof TOOL_NAMES)[keyof typeof TOOL_NAMES];

// ─── Tool Input Types ───────────────────────────────────────────────────────

export interface VerifyEntityInput {
  name?: string;
  uei?: string;
  check_exclusions?: boolean;
}

export interface ScreenSanctionsInput {
  name: string;
  schema?: "Company" | "Person";
  dataset?: "default" | "sanctions" | "peps" | "us_sanctions";
}

export interface FetchSubawardsInput {
  award_id: string;
  limit?: number;
}

export interface FetchComparableAwardsInput {
  naics_code?: string;
  psc_code?: string;
  agency?: string;
  exclude_recipient?: string;
  period_start?: string;
  period_end?: string;
  limit?: number;
}

export interface AnalyzeStatisticalPatternInput {
  field: string;
  group_by?: string;
  method: "mean" | "median" | "iqr" | "zscore" | "distribution" | "concentration";
  filter?: Record<string, string>;
}

export interface LookupAwardDetailInput {
  award_id: string;
}

export type ToolInput =
  | VerifyEntityInput
  | ScreenSanctionsInput
  | FetchSubawardsInput
  | FetchComparableAwardsInput
  | AnalyzeStatisticalPatternInput
  | LookupAwardDetailInput;

// ─── Tool Output Types ──────────────────────────────────────────────────────

export interface VerifyEntityOutput {
  entity: EntityVerificationResult;
  exclusions?: ExclusionCheckResult;
}

export interface ScreenSanctionsOutput {
  result: SanctionsScreeningResult;
}

export interface FetchSubawardsOutput {
  subawards: SubAwardResult;
}

export interface FetchComparableAwardsOutput {
  awards: Array<{
    awardId: string;
    recipientName: string;
    agency: string;
    amount: number;
    extentCompeted?: string;
    naicsCode?: string;
  }>;
  totalFound: number;
  source: string;
}

export interface AnalyzeStatisticalPatternOutput {
  field: string;
  groupBy?: string;
  method: string;
  results: Array<{
    group: string;
    value: number;
    count: number;
    details?: Record<string, unknown>;
  }>;
  summary: string;
}

export interface LookupAwardDetailOutput {
  award: Record<string, unknown> | null;
  source: string;
}

export type ToolOutput =
  | VerifyEntityOutput
  | ScreenSanctionsOutput
  | FetchSubawardsOutput
  | FetchComparableAwardsOutput
  | AnalyzeStatisticalPatternOutput
  | LookupAwardDetailOutput;

// ─── Tool Executor ──────────────────────────────────────────────────────────

/**
 * A tool executor function: takes parsed input, returns structured output.
 * Implementations are provided when constructing the investigator agent.
 */
export type ToolExecutorFn<I = Record<string, unknown>, O = Record<string, unknown>> =
  (input: I) => Promise<O>;

/**
 * Map of tool names to their executor functions.
 * Injected into the agent at construction time.
 */
export interface ToolExecutorMap {
  [TOOL_NAMES.VERIFY_ENTITY]: ToolExecutorFn<VerifyEntityInput, VerifyEntityOutput>;
  [TOOL_NAMES.SCREEN_SANCTIONS]: ToolExecutorFn<ScreenSanctionsInput, ScreenSanctionsOutput>;
  [TOOL_NAMES.FETCH_SUBAWARDS]: ToolExecutorFn<FetchSubawardsInput, FetchSubawardsOutput>;
  [TOOL_NAMES.FETCH_COMPARABLE_AWARDS]: ToolExecutorFn<FetchComparableAwardsInput, FetchComparableAwardsOutput>;
  [TOOL_NAMES.ANALYZE_STATISTICAL_PATTERN]: ToolExecutorFn<AnalyzeStatisticalPatternInput, AnalyzeStatisticalPatternOutput>;
  [TOOL_NAMES.LOOKUP_AWARD_DETAIL]: ToolExecutorFn<LookupAwardDetailInput, LookupAwardDetailOutput>;
}

// ─── Tool Definitions (Anthropic SDK format) ────────────────────────────────

type Tool = Anthropic.Messages.Tool;

const verifyEntityTool: Tool = {
  name: TOOL_NAMES.VERIFY_ENTITY,
  description:
    "Look up an entity in the SAM.gov Entity Management system. Returns registration " +
    "details including entity type (e.g., FFRDC, small business), status, CAGE code, " +
    "parent company, and exclusion/debarment status. Use this to understand the nature " +
    "of a contractor and whether concentration or non-competitive patterns have structural " +
    "explanations (e.g., FFRDCs, UARCs). Provide either a business name or UEI.",
  input_schema: {
    type: "object" as const,
    properties: {
      name: {
        type: "string",
        description: "Legal business name to search (e.g., 'MASSACHUSETTS INST OF TECHNOLOGY')",
      },
      uei: {
        type: "string",
        description: "Unique Entity Identifier (UEI) for direct lookup",
      },
      check_exclusions: {
        type: "boolean",
        description: "Also check the exclusions/debarment list (default: true)",
      },
    },
  },
};

const screenSanctionsTool: Tool = {
  name: TOOL_NAMES.SCREEN_SANCTIONS,
  description:
    "Screen an entity against international sanctions lists, debarment databases, and " +
    "Politically Exposed Persons (PEP) registries via OpenSanctions. Returns a fuzzy " +
    "match score (0-1) and matched datasets. Use as a baseline integrity check for " +
    "recipients with unusual patterns.",
  input_schema: {
    type: "object" as const,
    properties: {
      name: {
        type: "string",
        description: "Entity name to screen (e.g., 'Raytheon Technologies')",
      },
      schema: {
        type: "string",
        enum: ["Company", "Person"],
        description: "Entity type for matching accuracy (default: 'Company')",
      },
      dataset: {
        type: "string",
        enum: ["default", "sanctions", "peps", "us_sanctions"],
        description: "Dataset to search against (default: 'default' for all sources)",
      },
    },
    required: ["name"],
  },
};

const fetchSubawardsTool: Tool = {
  name: TOOL_NAMES.FETCH_SUBAWARDS,
  description:
    "Fetch sub-award data for a specific prime award from USAspending. Reveals " +
    "pass-through arrangements where a prime contractor distributes work to " +
    "sub-recipients. Useful for understanding whether concentration patterns " +
    "reflect genuine sole-source work or pass-through arrangements.",
  input_schema: {
    type: "object" as const,
    properties: {
      award_id: {
        type: "string",
        description: "The prime award's generated unique ID from USAspending",
      },
      limit: {
        type: "number",
        description: "Maximum sub-awards to return (default: 50)",
      },
    },
    required: ["award_id"],
  },
};

const fetchComparableAwardsTool: Tool = {
  name: TOOL_NAMES.FETCH_COMPARABLE_AWARDS,
  description:
    "Search USAspending for awards similar to the ones under investigation, but from " +
    "different agencies or recipients. Use this to establish baselines -- e.g., 'Is 80% " +
    "non-competitive rate normal for this NAICS code?' or 'Do other agencies award " +
    "similar contracts competitively?' This contextualizes whether a pattern is " +
    "entity-specific or industry-wide.",
  input_schema: {
    type: "object" as const,
    properties: {
      naics_code: {
        type: "string",
        description: "NAICS code to filter by (e.g., '541715' for R&D)",
      },
      psc_code: {
        type: "string",
        description: "Product/Service code to filter by",
      },
      agency: {
        type: "string",
        description: "Restrict to a specific awarding agency",
      },
      exclude_recipient: {
        type: "string",
        description: "Exclude this recipient from results (for comparison baselines)",
      },
      period_start: {
        type: "string",
        description: "Start date (ISO format: YYYY-MM-DD)",
      },
      period_end: {
        type: "string",
        description: "End date (ISO format: YYYY-MM-DD)",
      },
      limit: {
        type: "number",
        description: "Maximum awards to return (default: 25)",
      },
    },
  },
};

const analyzeStatisticalPatternTool: Tool = {
  name: TOOL_NAMES.ANALYZE_STATISTICAL_PATTERN,
  description:
    "Run statistical analysis on the current award dataset in memory. Computes " +
    "aggregations grouped by a field (e.g., recipient, NAICS, competition type). " +
    "Available methods: mean, median, iqr (interquartile range), zscore (outlier " +
    "detection), distribution (frequency counts), concentration (HHI/share analysis). " +
    "Use to drill deeper into patterns flagged by initial signals.",
  input_schema: {
    type: "object" as const,
    properties: {
      field: {
        type: "string",
        description:
          "Award field to analyze (e.g., 'awardAmount', 'numberOfOffersReceived', 'extentCompeted')",
      },
      group_by: {
        type: "string",
        description:
          "Field to group by before analysis (e.g., 'recipientName', 'naicsCode', 'awardType')",
      },
      method: {
        type: "string",
        enum: ["mean", "median", "iqr", "zscore", "distribution", "concentration"],
        description: "Statistical method to apply",
      },
      filter: {
        type: "object",
        description: "Optional key-value filters to apply before analysis (e.g., {extentCompeted: 'A'})",
        additionalProperties: { type: "string" },
      },
    },
    required: ["field", "method"],
  },
};

const lookupAwardDetailTool: Tool = {
  name: TOOL_NAMES.LOOKUP_AWARD_DETAIL,
  description:
    "Fetch full details for a specific award by its USAspending ID. Returns " +
    "competition data, recipient info, pricing type, set-aside status, period of " +
    "performance, and sub-award summary. Use when a specific award in the dataset " +
    "needs closer examination.",
  input_schema: {
    type: "object" as const,
    properties: {
      award_id: {
        type: "string",
        description: "The award's generated unique ID from USAspending",
      },
    },
    required: ["award_id"],
  },
};

/**
 * All tool definitions for the Anthropic messages API.
 */
export const TOOL_DEFINITIONS: Tool[] = [
  verifyEntityTool,
  screenSanctionsTool,
  fetchSubawardsTool,
  fetchComparableAwardsTool,
  analyzeStatisticalPatternTool,
  lookupAwardDetailTool,
];

// ─── Tool Execution Dispatcher ──────────────────────────────────────────────

/**
 * Execute a tool call by name, recording timing and provenance.
 * Returns a ToolCallRecord for the investigation log.
 */
export async function executeToolCall(
  toolName: string,
  input: Record<string, unknown>,
  executors: ToolExecutorMap,
): Promise<{ result: ToolOutput; record: ToolCallRecord }> {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();

  let output: ToolOutput;
  let error: string | undefined;
  let cacheHit = false;

  try {
    // Input comes from Anthropic API as parsed JSON — cast through unknown
    // since the model validates against input_schema before sending.
    const args = input as unknown;
    switch (toolName) {
      case TOOL_NAMES.VERIFY_ENTITY:
        output = await executors[TOOL_NAMES.VERIFY_ENTITY](args as VerifyEntityInput);
        cacheHit = (output as VerifyEntityOutput).entity.provenance.cacheHit;
        break;
      case TOOL_NAMES.SCREEN_SANCTIONS:
        output = await executors[TOOL_NAMES.SCREEN_SANCTIONS](args as ScreenSanctionsInput);
        cacheHit = (output as ScreenSanctionsOutput).result.provenance.cacheHit;
        break;
      case TOOL_NAMES.FETCH_SUBAWARDS:
        output = await executors[TOOL_NAMES.FETCH_SUBAWARDS](args as FetchSubawardsInput);
        cacheHit = (output as FetchSubawardsOutput).subawards.provenance.cacheHit;
        break;
      case TOOL_NAMES.FETCH_COMPARABLE_AWARDS:
        output = await executors[TOOL_NAMES.FETCH_COMPARABLE_AWARDS](args as FetchComparableAwardsInput);
        break;
      case TOOL_NAMES.ANALYZE_STATISTICAL_PATTERN:
        output = await executors[TOOL_NAMES.ANALYZE_STATISTICAL_PATTERN](args as AnalyzeStatisticalPatternInput);
        break;
      case TOOL_NAMES.LOOKUP_AWARD_DETAIL:
        output = await executors[TOOL_NAMES.LOOKUP_AWARD_DETAIL](args as LookupAwardDetailInput);
        break;
      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
    output = { error } as unknown as ToolOutput;
  }

  const durationMs = Date.now() - startTime;

  const record: ToolCallRecord = {
    toolName,
    input,
    output: output as unknown as Record<string, unknown>,
    durationMs,
    cacheHit,
    timestamp,
    error,
  };

  return { result: output, record };
}
