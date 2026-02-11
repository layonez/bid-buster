/**
 * Investigation pipeline orchestrator.
 * Runs: Collector → Signaler → Hypothesis → Prover → Narrator → Verifier → case folder
 */
import type pino from "pino";
import type { AppConfig } from "../cli/config.js";
import type { InvestigationParams } from "../shared/types.js";
import { runCollector } from "../collector/index.js";
import { SignalEngine } from "../signaler/engine.js";
import { generateHypotheses } from "../hypothesis/generator.js";
import { produceEvidence } from "../prover/analyzer.js";
import { assembleReport } from "../narrator/report.js";
import { enhanceNarrative } from "../narrator/enhancer.js";
import { verifyReport } from "../verifier/checker.js";
import { createProvenance } from "../shared/provenance.js";
import { createCaseFolder, writeJson } from "../shared/fs.js";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";

export interface PipelineOptions {
  withTransactions?: boolean;
}

export async function runInvestigation(
  params: InvestigationParams,
  config: AppConfig,
  logger: pino.Logger,
  options: PipelineOptions = {},
): Promise<string> {
  const startTime = Date.now();
  const withTransactions = options.withTransactions ?? false;
  const totalSteps = 7;

  // ─── Step 1: Collect ───────────────────────────────────────────────────
  logger.info(`Step 1/${totalSteps}: Collecting data from USAspending...`);

  const collectorResult = await runCollector(
    {
      agency: params.agency,
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

  // ─── Step 2: Compute Signals ───────────────────────────────────────────
  logger.info(`Step 2/${totalSteps}: Computing red-flag signals...`);

  const engine = new SignalEngine();
  engine.initialize(config);
  engine.processAwards(collectorResult.awards);

  // Feed transaction data to indicators (R005) if available
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

  // ─── Step 3: Generate Hypotheses ───────────────────────────────────────
  logger.info(`Step 3/${totalSteps}: Generating hypotheses...`);

  const hypotheses = await generateHypotheses(signalResult.signals, {
    aiEnabled: config.ai.enabled,
    model: config.ai.model,
    logger,
  });

  logger.info({ hypotheses: hypotheses.length }, "Hypotheses generated");

  // ─── Step 4: Produce Evidence ──────────────────────────────────────────
  logger.info(`Step 4/${totalSteps}: Producing evidence tables...`);

  // Create case folder early so prover can write evidence files
  const caseFolder = await createCaseFolder(params.outputDir);

  const evidence = await produceEvidence({
    hypotheses,
    signalResult,
    awards: collectorResult.awards,
    transactions: collectorResult.transactions,
    evidenceDir: caseFolder.evidenceDir,
  });

  logger.info({ artifacts: evidence.length }, "Evidence artifacts produced");

  // ─── Step 5: AI-Enhanced Narrative ─────────────────────────────────────
  logger.info(`Step 5/${totalSteps}: Enhancing narrative...`);

  const enhancedHypotheses = await enhanceNarrative(hypotheses, signalResult, {
    aiEnabled: config.ai.enabled,
    model: config.ai.model,
    logger,
  });

  // ─── Step 6: Assemble Report ───────────────────────────────────────────
  logger.info(`Step 6/${totalSteps}: Assembling case report...`);

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
  );

  const report = assembleReport({
    params,
    signalResult,
    hypotheses: enhancedHypotheses,
    evidence,
    provenance,
  });

  // ─── Step 7: Verify ─────────────────────────────────────────────────────
  logger.info(`Step 7/${totalSteps}: Verifying report claims...`);

  const verification = verifyReport(report, signalResult);
  logger.info(
    { claims: verification.totalClaims, supported: verification.supported, unsupported: verification.unsupported },
    verification.passed ? "Verification passed" : "Verification found unsupported claims",
  );

  // ─── Write Case Folder ─────────────────────────────────────────────────
  await writeFile(caseFolder.caseReport, report, "utf-8");
  await writeJson(caseFolder.provenancePath, provenance);
  await writeJson(join(caseFolder.path, "signals.json"), signalResult);
  await writeJson(join(caseFolder.path, "hypotheses.json"), enhancedHypotheses);
  await writeJson(join(caseFolder.path, "verification.json"), verification);
  await writeJson(join(caseFolder.path, "awards.json"), collectorResult.awards);
  await writeJson(join(caseFolder.path, "evidence-manifest.json"), evidence);

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  logger.info(
    { path: caseFolder.path, elapsed: `${elapsed}s` },
    "Investigation complete",
  );

  return caseFolder.path;
}
