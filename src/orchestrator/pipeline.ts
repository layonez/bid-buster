/**
 * Investigation pipeline orchestrator.
 * Runs: Collector → Signaler → Hypothesis → Narrator → case folder
 */
import type pino from "pino";
import type { AppConfig } from "../cli/config.js";
import type { InvestigationParams } from "../shared/types.js";
import { runCollector } from "../collector/index.js";
import { SignalEngine } from "../signaler/engine.js";
import { generateHypotheses } from "../hypothesis/generator.js";
import { assembleReport } from "../narrator/report.js";
import { createProvenance } from "../shared/provenance.js";
import { createCaseFolder, writeJson } from "../shared/fs.js";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";

export async function runInvestigation(
  params: InvestigationParams,
  config: AppConfig,
  logger: pino.Logger,
): Promise<string> {
  const startTime = Date.now();

  // ─── Step 1: Collect ───────────────────────────────────────────────────
  logger.info("Step 1/4: Collecting data from USAspending...");

  const collectorResult = await runCollector(
    {
      agency: params.agency,
      recipient: params.recipient,
      periodStart: params.periodStart,
      periodEnd: params.periodEnd,
      awardTypeCodes: params.awardTypeCodes,
      withDetails: true,
      withTransactions: false, // Keep fast for now
      pageLimit: 100,
    },
    config,
    logger,
  );

  // ─── Step 2: Compute Signals ───────────────────────────────────────────
  logger.info("Step 2/4: Computing red-flag signals...");

  const engine = new SignalEngine();
  engine.initialize(config);
  engine.processAwards(collectorResult.awards);
  const signalResult = engine.finalize();

  logger.info(
    { signals: signalResult.summary.totalSignals },
    "Signal computation complete",
  );

  // ─── Step 3: Generate Hypotheses ───────────────────────────────────────
  logger.info("Step 3/4: Generating hypotheses...");

  const hypotheses = await generateHypotheses(signalResult.signals, {
    aiEnabled: config.ai.enabled,
    model: config.ai.model,
    logger,
  });

  logger.info({ hypotheses: hypotheses.length }, "Hypotheses generated");

  // ─── Step 4: Assemble Report ───────────────────────────────────────────
  logger.info("Step 4/4: Assembling case report...");

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
    hypotheses,
    evidence: [],
    provenance,
  });

  // ─── Write Case Folder ─────────────────────────────────────────────────
  const caseFolder = await createCaseFolder(params.outputDir);

  await writeFile(caseFolder.caseReport, report, "utf-8");
  await writeJson(caseFolder.provenancePath, provenance);
  await writeJson(join(caseFolder.path, "signals.json"), signalResult);
  await writeJson(join(caseFolder.path, "hypotheses.json"), hypotheses);
  await writeJson(join(caseFolder.path, "awards.json"), collectorResult.awards);

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  logger.info(
    { path: caseFolder.path, elapsed: `${elapsed}s` },
    "Investigation complete",
  );

  return caseFolder.path;
}
