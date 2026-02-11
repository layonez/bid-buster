/**
 * Investigation pipeline orchestrator.
 * 8-step pipeline:
 *   Collect → Signal → Investigate → Hypothesize → Prove → Enhance → Report+Dashboard → Verify
 */
import type pino from "pino";
import type { AppConfig } from "../cli/config.js";
import type { InvestigationParams, InvestigationFindings, ChartArtifact, QueryContext, MaterialFinding, InvestigationNarrative } from "../shared/types.js";
import { runCollector } from "../collector/index.js";
import { USAspendingClient } from "../collector/usaspending.js";
import { SignalEngine } from "../signaler/engine.js";
import { consolidateSignals, computeConvergence } from "../signaler/consolidator.js";
import { generateHypotheses } from "../hypothesis/generator.js";
import { produceEvidence } from "../prover/analyzer.js";
import { buildCharts } from "../prover/charts.js";
import { assembleReport } from "../narrator/report.js";
import { enhanceNarrative } from "../narrator/enhancer.js";
import { generateBriefing, generateAiNarrative } from "../narrator/briefing.js";
import { buildAwardUrlMap } from "../shared/urls.js";
import { renderNarrative } from "../narrator/narrative.js";
import { buildDashboard } from "../narrator/dashboard.js";
import { verifyReport } from "../verifier/checker.js";
import { runInvestigativeAgent } from "../investigator/agent.js";
import {
  SamGovClient,
  OpenSanctionsClient,
  SubAwardsClient,
} from "../enrichment/index.js";
import { createProvenance } from "../shared/provenance.js";
import { createCaseFolder, writeJson, sha256 } from "../shared/fs.js";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";

export interface PipelineOptions {
  withTransactions?: boolean;
  deep?: boolean;
  charts?: boolean;
  noAi?: boolean;
  fullEvidence?: boolean;
}

export async function runInvestigation(
  params: InvestigationParams,
  config: AppConfig,
  logger: pino.Logger,
  options: PipelineOptions = {},
): Promise<string> {
  const startTime = Date.now();
  const withTransactions = options.withTransactions ?? false;
  const deep = options.deep ?? false;
  const chartsEnabled = options.charts !== false;
  const aiEnabled = options.noAi ? false : config.ai.enabled;
  const totalSteps = 8;

  // ─── Step 1: Collect ───────────────────────────────────────────────────
  logger.info(`Step 1/${totalSteps}: Collecting data from USAspending...`);

  const collectorResult = await runCollector(
    {
      agency: params.agency,
      subtierAgency: params.subtierAgency,
      recipient: params.recipient,
      periodStart: params.periodStart,
      periodEnd: params.periodEnd,
      awardTypeCodes: params.awardTypeCodes,
      withDetails: true,
      withTransactions,
      pageLimit: 100,
    },
    config,
    logger,
  );

  // ─── Construct QueryContext ───────────────────────────────────────────
  const queryContext: QueryContext = {
    recipientFilter: params.recipient,
    agencyFilter: params.agency,
    subtierAgencyFilter: params.subtierAgency,
    periodStart: params.periodStart,
    periodEnd: params.periodEnd,
    isRecipientFiltered: !!params.recipient,
    isAgencyFiltered: !!params.agency || !!params.subtierAgency,
    isSubtierFiltered: !!params.subtierAgency,
  };

  // ─── Step 2: Compute Signals ───────────────────────────────────────────
  logger.info(`Step 2/${totalSteps}: Computing red-flag signals...`);

  const engine = new SignalEngine();
  engine.initialize(config, undefined, queryContext);
  engine.processAwards(collectorResult.awards);

  if (collectorResult.transactions.size > 0) {
    engine.processTransactions(collectorResult.transactions);
    logger.info(
      { awards: collectorResult.transactions.size },
      "Transaction data fed to signal engine",
    );
  }

  const signalResult = engine.finalize();

  logger.info(
    { signals: signalResult.summary.totalSignals },
    "Signal computation complete",
  );

  // ─── Step 2.5: Consolidate Signals into Material Findings ──────────────
  let materialFindings = consolidateSignals(
    signalResult.signals,
    collectorResult.awards,
    config.materiality,
  );

  logger.info(
    { findings: materialFindings.length, from: signalResult.summary.totalSignals },
    "Signals consolidated into material findings",
  );

  // ─── Step 3: Investigate (--deep only) ─────────────────────────────────
  let investigationFindings: InvestigationFindings | undefined;

  if (deep && config.investigator.enabled) {
    logger.info(`Step 3/${totalSteps}: Running Opus 4.6 investigative agent...`);

    const deps = buildEnrichmentDeps(config, logger);

    const hypothesesForAgent = await generateHypotheses(signalResult.signals, {
      aiEnabled: false,
      model: config.ai.model,
      logger,
    });

    investigationFindings = await runInvestigativeAgent({
      signals: signalResult.signals,
      hypotheses: hypothesesForAgent,
      awards: collectorResult.awards,
      config: config.investigator,
      deps,
      logger,
    });

    logger.info(
      {
        iterations: investigationFindings.iterations,
        toolCalls: investigationFindings.toolCallLog.length,
        costUsd: investigationFindings.estimatedCostUsd.toFixed(4),
      },
      "Investigation complete",
    );
    // Merge agent-created findings
    if (investigationFindings.agentFindings && investigationFindings.agentFindings.length > 0) {
      materialFindings = [...materialFindings, ...investigationFindings.agentFindings];
      logger.info(
        { agentFindings: investigationFindings.agentFindings.length },
        "Agent findings merged into material findings",
      );
    }
  } else {
    logger.info(`Step 3/${totalSteps}: Skipping investigative agent (use --deep to enable)`);
  }

  // ─── Step 3.5: Convergence Analysis ──────────────────────────────────
  const convergenceEntities = computeConvergence(materialFindings);
  if (convergenceEntities.length > 0) {
    logger.info(
      { convergentEntities: convergenceEntities.length, topIndicatorCount: convergenceEntities[0]?.indicators.length },
      "Multi-signal convergence entities identified",
    );
  }

  // ─── Step 4: Generate Hypotheses ───────────────────────────────────────
  logger.info(`Step 4/${totalSteps}: Generating hypotheses...`);

  const hypotheses = await generateHypotheses(signalResult.signals, {
    aiEnabled,
    model: config.ai.model,
    logger,
  });

  logger.info({ hypotheses: hypotheses.length }, "Hypotheses generated");

  // ─── Step 5: Produce Evidence (CSVs + Charts) ─────────────────────────
  logger.info(`Step 5/${totalSteps}: Producing evidence...`);

  const caseFolder = await createCaseFolder(params.outputDir, undefined, {
    agency: params.agency,
    subtierAgency: params.subtierAgency,
    recipient: params.recipient,
    fullEvidence: options.fullEvidence,
  });

  const evidence = await produceEvidence({
    hypotheses,
    signalResult,
    awards: collectorResult.awards,
    transactions: collectorResult.transactions,
    evidenceDir: caseFolder.evidenceDir,
    findings: materialFindings,
    fullEvidence: options.fullEvidence,
    summaryEvidenceDir: caseFolder.summaryEvidenceDir,
    detailEvidenceDir: caseFolder.detailEvidenceDir,
  });

  logger.info({ artifacts: evidence.length }, "CSV evidence artifacts produced");

  let charts: ChartArtifact[] = [];
  if (chartsEnabled) {
    charts = await buildCharts({
      awards: collectorResult.awards,
      signals: signalResult.signals,
      transactions: collectorResult.transactions,
      config,
      evidenceDir: caseFolder.chartsDir,
    });

    if (charts.length > 0) {
      logger.info({ charts: charts.length }, "Chart artifacts produced");
    }
  }

  // ─── Step 6: AI-Enhanced Narrative ─────────────────────────────────────
  logger.info(`Step 6/${totalSteps}: Enhancing narrative...`);

  // Filter to material-finding-linked hypotheses only (cost-efficient: ~11 vs 613)
  const materialIndicatorEntities = new Set(
    materialFindings.map((f) => `${f.indicatorId}::${f.entityName.slice(0, 10).toUpperCase().replace(/[^A-Z0-9]/g, "")}`),
  );
  const materialHypotheses = hypotheses.filter((h) => {
    if (h.id === "H-EXECUTIVE") return true;
    return h.signalIds.some((sid) =>
      materialIndicatorEntities.has(
        `${sid}::${h.id.replace(/^H-[A-Z0-9]+-/, "").slice(0, 10)}`,
      ),
    ) || materialFindings.some((f) =>
      h.signalIds.includes(f.indicatorId) &&
      h.id.includes(f.entityName.slice(0, 10).toUpperCase().replace(/[^A-Z0-9]/g, "")),
    );
  });

  logger.info(
    { total: hypotheses.length, material: materialHypotheses.length },
    "Filtered hypotheses to material-finding-linked for AI enhancement",
  );

  const enhancedMaterial = await enhanceNarrative(materialHypotheses, signalResult, {
    aiEnabled,
    model: config.ai.model,
    logger,
  });

  // Merge: enhanced material hypotheses replace originals, rest stay as-is
  const enhancedMap = new Map(enhancedMaterial.map((h) => [h.id, h]));
  const enhancedHypotheses = hypotheses.map((h) => enhancedMap.get(h.id) ?? h);

  // Generate AI narrative for briefing + dashboard executive summary
  const aiNarrative = await generateAiNarrative(
    materialFindings,
    params,
    collectorResult.awards.length,
    signalResult.summary.totalSignals,
    { aiEnabled, logger },
  );

  // If we have an AI narrative, set it as the H-EXECUTIVE context for dashboard display
  if (aiNarrative) {
    const execIdx = enhancedHypotheses.findIndex((h) => h.id === "H-EXECUTIVE");
    if (execIdx >= 0) {
      enhancedHypotheses[execIdx] = {
        ...enhancedHypotheses[execIdx],
        context: aiNarrative,
      };
    }
  }

  // Build award URL map for USAspending links
  const awardUrlMap = buildAwardUrlMap(collectorResult.awards);

  // ─── Step 7: Assemble Report + Dashboard ───────────────────────────────
  logger.info(`Step 7/${totalSteps}: Assembling case report and dashboard...`);

  // Compute file hashes for provenance
  const signalJson = JSON.stringify(signalResult, null, 2);
  const findingsJson = JSON.stringify(materialFindings, null, 2);
  const fileHashes: Record<string, string> = {
    "signals.json": sha256(signalJson),
    "findings.json": sha256(findingsJson),
  };

  const provenance = createProvenance(
    params as unknown as Record<string, unknown>,
    [
      {
        name: "USAspending API",
        endpoint: config.api.baseUrl,
        snapshotDate: new Date().toISOString().slice(0, 10),
        recordCount: collectorResult.awards.length,
        cacheHit: collectorResult.raw.cacheHits > 0,
      },
    ],
    fileHashes,
  );

  const report = assembleReport({
    params,
    signalResult,
    hypotheses: enhancedHypotheses,
    evidence,
    provenance,
    charts,
    investigationFindings,
    queryContext,
    materialFindings,
  });

  // Build interactive dashboard
  const agencyLabel = params.subtierAgency ?? params.agency ?? "All Agencies";
  const title = params.recipient
    ? `${agencyLabel} → ${params.recipient}`
    : agencyLabel !== "All Agencies" ? agencyLabel : "Investigation";

  const dashboardHtml = buildDashboard({
    title,
    generatedAt: provenance.timestamp,
    params,
    awards: collectorResult.awards.map((a) => a as unknown as Record<string, unknown>),
    signals: signalResult.signals,
    hypotheses: enhancedHypotheses,
    evidence,
    charts,
    provenance,
    investigationFindings,
    materialFindings,
    convergenceEntities,
  });

  // ─── Step 8: Verify ───────────────────────────────────────────────────
  logger.info(`Step 8/${totalSteps}: Verifying report claims...`);

  const verification = verifyReport(report, signalResult, queryContext, materialFindings);
  logger.info(
    { claims: verification.totalClaims, supported: verification.supported, unsupported: verification.unsupported },
    verification.passed ? "Verification passed" : "Verification found unsupported claims",
  );

  // ─── Write Case Folder ─────────────────────────────────────────────────

  // Generate executive briefing (README.md)
  const briefing = generateBriefing({
    findings: materialFindings,
    params,
    queryContext,
    totalAwards: collectorResult.awards.length,
    totalSignals: signalResult.summary.totalSignals,
    aiNarrative,
    awardUrlMap,
    convergenceEntities,
  });
  await writeFile(join(caseFolder.path, "README.md"), briefing, "utf-8");

  // Core report files
  await writeFile(caseFolder.caseReport, report, "utf-8");
  await writeFile(join(caseFolder.path, "dashboard.html"), dashboardHtml, "utf-8");
  await writeJson(caseFolder.provenancePath, provenance);

  // Data files -> data/ subdirectory (canonical location for all JSON artifacts)
  await writeJson(join(caseFolder.dataDir, "signals.json"), signalResult);
  await writeJson(join(caseFolder.dataDir, "hypotheses.json"), enhancedHypotheses);
  await writeJson(join(caseFolder.dataDir, "verification.json"), verification);
  await writeJson(join(caseFolder.dataDir, "evidence-manifest.json"), evidence);
  await writeJson(join(caseFolder.dataDir, "findings.json"), materialFindings);
  if (convergenceEntities.length > 0) {
    await writeJson(join(caseFolder.dataDir, "convergence.json"), convergenceEntities);
  }

  // Raw awards data is large (~11 MB for DoD); only write with --full-evidence
  if (options.fullEvidence) {
    await writeJson(join(caseFolder.dataDir, "awards.json"), collectorResult.awards);
  }

  if (investigationFindings) {
    await writeJson(join(caseFolder.dataDir, "investigation.json"), investigationFindings);

    // Write investigation narrative if reasoning steps exist
    if (investigationFindings.reasoningSteps || investigationFindings.agentFindings) {
      const narrative: InvestigationNarrative = {
        steps: investigationFindings.reasoningSteps ?? [],
        agentFindings: investigationFindings.agentFindings ?? [],
      };
      const narrativeMd = renderNarrative(narrative);
      await writeFile(join(caseFolder.path, "investigation-narrative.md"), narrativeMd, "utf-8");

      // Also write the raw conversation log if available
      await writeJson(join(caseFolder.dataDir, "investigation-conversation.json"), {
        reasoningSteps: narrative.steps,
        agentFindings: narrative.agentFindings,
        toolCallLog: investigationFindings.toolCallLog,
      });
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  logger.info(
    { path: caseFolder.path, elapsed: `${elapsed}s` },
    "Investigation complete",
  );

  return caseFolder.path;
}

// ─── Enrichment Client Construction ──────────────────────────────────────────

function buildEnrichmentDeps(
  config: AppConfig,
  logger: pino.Logger,
): {
  samGovClient?: SamGovClient;
  openSanctionsClient?: OpenSanctionsClient;
  subAwardsClient?: SubAwardsClient;
  usaspendingClient?: USAspendingClient;
} {
  let samGovClient: SamGovClient | undefined;
  let openSanctionsClient: OpenSanctionsClient | undefined;
  let subAwardsClient: SubAwardsClient | undefined;
  let usaspendingClient: USAspendingClient | undefined;

  if (config.enrichment.samGov.enabled) {
    try {
      samGovClient = new SamGovClient({
        baseUrl: config.enrichment.samGov.baseUrl,
        exclusionsUrl: config.enrichment.samGov.exclusionsUrl,
        requestsPerSecond: config.enrichment.samGov.requestsPerSecond,
        maxRetries: config.enrichment.samGov.maxRetries,
        cacheDirectory: config.cache.directory,
        cacheEnabled: config.cache.enabled,
        logger,
      });
    } catch (err) {
      logger.warn({ error: (err as Error).message }, "SAM.gov client initialization failed");
    }
  }

  if (config.enrichment.openSanctions.enabled) {
    try {
      openSanctionsClient = new OpenSanctionsClient({
        baseUrl: config.enrichment.openSanctions.baseUrl,
        dataset: config.enrichment.openSanctions.dataset,
        scoreThreshold: config.enrichment.openSanctions.scoreThreshold,
        maxRetries: config.enrichment.openSanctions.maxRetries,
        cacheDirectory: config.cache.directory,
        cacheEnabled: config.cache.enabled,
        logger,
      });
    } catch (err) {
      logger.warn({ error: (err as Error).message }, "OpenSanctions client initialization failed");
    }
  }

  if (config.enrichment.subAwards.enabled) {
    try {
      subAwardsClient = new SubAwardsClient({
        baseUrl: config.api.baseUrl,
        requestsPerSecond: config.api.requestsPerSecond,
        maxRetries: config.api.maxRetries,
        maxPerAward: config.enrichment.subAwards.maxPerAward,
        cacheDirectory: config.cache.directory,
        cacheEnabled: config.cache.enabled,
        logger,
      });
    } catch (err) {
      logger.warn({ error: (err as Error).message }, "Sub-awards client initialization failed");
    }
  }

  // Reuse USAspending client for award detail lookups
  try {
    usaspendingClient = new USAspendingClient({
      baseUrl: config.api.baseUrl,
      requestsPerSecond: config.api.requestsPerSecond,
      maxRetries: config.api.maxRetries,
      pageSize: config.api.pageSize,
      cacheEnabled: config.cache.enabled,
      cacheDirectory: config.cache.directory,
      logger,
    });
  } catch (err) {
    logger.warn({ error: (err as Error).message }, "USAspending client initialization failed");
  }

  return { samGovClient, openSanctionsClient, subAwardsClient, usaspendingClient };
}
