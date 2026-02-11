/**
 * Configuration loading and validation.
 * Uses cosmiconfig for file discovery and zod for runtime validation.
 */
import { cosmiconfig } from "cosmiconfig";
import { z } from "zod";

// ─── Default values ──────────────────────────────────────────────────────────

const API_DEFAULTS = {
  baseUrl: "https://api.usaspending.gov/api/v2",
  requestsPerSecond: 2,
  maxRetries: 3,
  pageSize: 100,
} as const;

const CACHE_DEFAULTS = {
  directory: ".cache",
  enabled: true,
} as const;

const AI_DEFAULTS = {
  enabled: true,
  model: "claude-opus-4-6-20250219",
} as const;

const ENRICHMENT_DEFAULTS = {
  samGov: {
    enabled: true,
    baseUrl: "https://api.sam.gov/entity-information/v3/entities",
    exclusionsUrl: "https://api.sam.gov/entity-information/v4/exclusions",
    requestsPerSecond: 1,
    maxRetries: 2,
  },
  openSanctions: {
    enabled: true,
    baseUrl: "https://api.opensanctions.org",
    dataset: "default" as const,
    scoreThreshold: 0.7,
    maxRetries: 2,
  },
  subAwards: {
    enabled: true,
    maxPerAward: 100,
  },
} as const;

const MATERIALITY_DEFAULTS = {
  minAwardCount: 1,
  minTotalAmount: 0,
  maxFindings: 20,
  maxPerIndicator: 5,
} as const;

const INVESTIGATOR_DEFAULTS = {
  enabled: true,
  model: "claude-opus-4-6-20250219",
  maxIterations: 10,
  maxTokensPerTurn: 4096,
  maxCostUsd: 2.0,
  toolChoice: "auto" as const,
} as const;

const CHARTS_DEFAULTS = {
  enabled: true,
  width: 600,
  height: 400,
  types: {
    awardDistribution: true,
    vendorConcentration: true,
    competitionBreakdown: true,
    priceOutlier: true,
    modificationTimeline: true,
    thresholdClustering: true,
  },
} as const;

const SIGNAL_DEFAULTS = {
  R001_single_bid: {
    enabled: true,
    severityThreshold: 0.2,
    requireCompetitiveType: true,
  },
  R002_non_competitive: {
    enabled: true,
    codesToFlag: ["B", "C", "G", "NDO"],
  },
  R003_splitting: {
    enabled: true,
    thresholds: [250_000, 7_500_000],
    bandWidthPct: 0.1,
    minClusterSize: 3,
    period: "quarter" as const,
  },
  R004_concentration: {
    enabled: true,
    vendorShareThreshold: 0.3,
    spikeThreshold: 0.15,
  },
  R005_modifications: {
    enabled: true,
    maxModificationCount: 5,
    maxGrowthRatio: 2.0,
  },
  R006_price_outliers: {
    enabled: true,
    method: "iqr" as const,
    iqrMultiplier: 1.5,
    zscoreThreshold: 2.0,
    minGroupSize: 5,
  },
};

// ─── Schema ──────────────────────────────────────────────────────────────────

const ApiSchema = z.object({
  baseUrl: z.string().optional(),
  requestsPerSecond: z.number().optional(),
  maxRetries: z.number().optional(),
  pageSize: z.number().max(100).optional(),
});

const CacheSchema = z.object({
  directory: z.string().optional(),
  enabled: z.boolean().optional(),
});

const AiSchema = z.object({
  enabled: z.boolean().optional(),
  model: z.string().optional(),
});

const SamGovSchema = z.object({
  enabled: z.boolean().optional(),
  baseUrl: z.string().optional(),
  exclusionsUrl: z.string().optional(),
  requestsPerSecond: z.number().optional(),
  maxRetries: z.number().optional(),
});

const OpenSanctionsSchema = z.object({
  enabled: z.boolean().optional(),
  baseUrl: z.string().optional(),
  dataset: z.enum(["default", "sanctions", "peps", "us_sanctions"]).optional(),
  scoreThreshold: z.number().min(0).max(1).optional(),
  maxRetries: z.number().optional(),
});

const SubAwardsSchema = z.object({
  enabled: z.boolean().optional(),
  maxPerAward: z.number().optional(),
});

const EnrichmentSchema = z.object({
  samGov: SamGovSchema.optional(),
  openSanctions: OpenSanctionsSchema.optional(),
  subAwards: SubAwardsSchema.optional(),
});

const InvestigatorSchema = z.object({
  enabled: z.boolean().optional(),
  model: z.string().optional(),
  maxIterations: z.number().min(1).max(50).optional(),
  maxTokensPerTurn: z.number().optional(),
  maxCostUsd: z.number().optional(),
  toolChoice: z.enum(["auto", "any", "none"]).optional(),
});

const ChartTypesSchema = z.object({
  awardDistribution: z.boolean().optional(),
  vendorConcentration: z.boolean().optional(),
  competitionBreakdown: z.boolean().optional(),
  priceOutlier: z.boolean().optional(),
  modificationTimeline: z.boolean().optional(),
  thresholdClustering: z.boolean().optional(),
});

const ChartsSchema = z.object({
  enabled: z.boolean().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  types: ChartTypesSchema.optional(),
});

const IndicatorSchema = z.object({
  enabled: z.boolean().optional(),
}).passthrough();

const MaterialitySchema = z.object({
  minAwardCount: z.number().optional(),
  minTotalAmount: z.number().optional(),
  maxFindings: z.number().optional(),
  maxPerIndicator: z.number().min(1).optional(),
});

const SignalSchema = z.object({
  R001_single_bid: IndicatorSchema.optional(),
  R002_non_competitive: IndicatorSchema.optional(),
  R003_splitting: IndicatorSchema.optional(),
  R004_concentration: IndicatorSchema.optional(),
  R005_modifications: IndicatorSchema.optional(),
  R006_price_outliers: IndicatorSchema.optional(),
});

const RawConfigSchema = z.object({
  api: ApiSchema.optional(),
  cache: CacheSchema.optional(),
  ai: AiSchema.optional(),
  signals: SignalSchema.optional(),
  materiality: MaterialitySchema.optional(),
  enrichment: EnrichmentSchema.optional(),
  investigator: InvestigatorSchema.optional(),
  charts: ChartsSchema.optional(),
});

// ─── Resolved config type ────────────────────────────────────────────────────

export interface AppConfig {
  api: {
    baseUrl: string;
    requestsPerSecond: number;
    maxRetries: number;
    pageSize: number;
  };
  cache: {
    directory: string;
    enabled: boolean;
  };
  ai: {
    enabled: boolean;
    model: string;
  };
  signals: {
    R001_single_bid: { enabled: boolean; severityThreshold: number; requireCompetitiveType: boolean };
    R002_non_competitive: { enabled: boolean; codesToFlag: string[] };
    R003_splitting: { enabled: boolean; thresholds: number[]; bandWidthPct: number; minClusterSize: number; period: "quarter" | "year" };
    R004_concentration: { enabled: boolean; vendorShareThreshold: number; spikeThreshold: number };
    R005_modifications: { enabled: boolean; maxModificationCount: number; maxGrowthRatio: number };
    R006_price_outliers: { enabled: boolean; method: "iqr" | "zscore"; iqrMultiplier: number; zscoreThreshold: number; minGroupSize: number };
  };
  materiality: {
    minAwardCount: number;
    minTotalAmount: number;
    maxFindings: number;
    maxPerIndicator: number;
  };
  enrichment: {
    samGov: {
      enabled: boolean;
      baseUrl: string;
      exclusionsUrl: string;
      requestsPerSecond: number;
      maxRetries: number;
    };
    openSanctions: {
      enabled: boolean;
      baseUrl: string;
      dataset: "default" | "sanctions" | "peps" | "us_sanctions";
      scoreThreshold: number;
      maxRetries: number;
    };
    subAwards: {
      enabled: boolean;
      maxPerAward: number;
    };
  };
  investigator: {
    enabled: boolean;
    model: string;
    maxIterations: number;
    maxTokensPerTurn: number;
    maxCostUsd: number;
    toolChoice: "auto" | "any" | "none";
  };
  charts: {
    enabled: boolean;
    width: number;
    height: number;
    types: {
      awardDistribution: boolean;
      vendorConcentration: boolean;
      competitionBreakdown: boolean;
      priceOutlier: boolean;
      modificationTimeline: boolean;
      thresholdClustering: boolean;
    };
  };
}

function deepMerge<T extends Record<string, unknown>>(defaults: T, overrides?: Record<string, unknown>): T {
  if (!overrides) return { ...defaults };
  const result = { ...defaults } as Record<string, unknown>;
  for (const key of Object.keys(overrides)) {
    if (overrides[key] !== undefined) {
      result[key] = overrides[key];
    }
  }
  return result as T;
}

function resolveConfig(raw: z.infer<typeof RawConfigSchema>): AppConfig {
  return {
    api: deepMerge(API_DEFAULTS, raw.api),
    cache: deepMerge(CACHE_DEFAULTS, raw.cache),
    ai: deepMerge(AI_DEFAULTS, raw.ai),
    signals: {
      R001_single_bid: deepMerge(SIGNAL_DEFAULTS.R001_single_bid, raw.signals?.R001_single_bid),
      R002_non_competitive: deepMerge(SIGNAL_DEFAULTS.R002_non_competitive, raw.signals?.R002_non_competitive),
      R003_splitting: deepMerge(SIGNAL_DEFAULTS.R003_splitting, raw.signals?.R003_splitting),
      R004_concentration: deepMerge(SIGNAL_DEFAULTS.R004_concentration, raw.signals?.R004_concentration),
      R005_modifications: deepMerge(SIGNAL_DEFAULTS.R005_modifications, raw.signals?.R005_modifications),
      R006_price_outliers: deepMerge(SIGNAL_DEFAULTS.R006_price_outliers, raw.signals?.R006_price_outliers),
    },
    materiality: deepMerge(MATERIALITY_DEFAULTS, raw.materiality),
    enrichment: {
      samGov: deepMerge(ENRICHMENT_DEFAULTS.samGov, raw.enrichment?.samGov),
      openSanctions: deepMerge(ENRICHMENT_DEFAULTS.openSanctions, raw.enrichment?.openSanctions),
      subAwards: deepMerge(ENRICHMENT_DEFAULTS.subAwards, raw.enrichment?.subAwards),
    },
    investigator: deepMerge(INVESTIGATOR_DEFAULTS, raw.investigator),
    charts: {
      ...deepMerge(CHARTS_DEFAULTS, raw.charts),
      types: deepMerge(CHARTS_DEFAULTS.types, raw.charts?.types),
    },
  };
}

// ─── Config loading ──────────────────────────────────────────────────────────

// Also export the schema for testing
export const AppConfigSchema = RawConfigSchema;

const explorer = cosmiconfig("investigate", {
  searchPlaces: [
    "investigate.config.yaml",
    "investigate.config.yml",
    "investigate.config.json",
    "investigate.config.js",
    ".investigaterc",
    ".investigaterc.yaml",
    ".investigaterc.json",
    "config/default.yaml",
  ],
});

export async function loadConfig(configPath?: string): Promise<AppConfig> {
  const result = configPath
    ? await explorer.load(configPath)
    : await explorer.search();

  const raw = RawConfigSchema.parse(result?.config ?? {});
  return resolveConfig(raw);
}
