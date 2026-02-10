/**
 * Signal command: compute red-flag indicators from cached procurement data.
 */
import { Command } from "commander";
import { readFile } from "node:fs/promises";
import { loadConfig } from "../config.js";
import { createLogger } from "../../shared/logger.js";
import { SignalEngine } from "../../signaler/engine.js";
import type { NormalizedAward } from "../../normalizer/schema.js";

export const signalCommand = new Command("signal")
  .description("Compute red-flag indicators from cached procurement data")
  .requiredOption("--input <path>", "Path to normalized awards JSON file")
  .option(
    "--indicators <ids>",
    "Comma-separated indicator IDs to run (default: all enabled)",
  )
  .option("--format <type>", "Output format: table, json", "table")
  .action(async (options) => {
    const parentOpts = options.parent?.parent?.opts() ?? {};
    const config = await loadConfig(parentOpts.config);
    const logger = createLogger(parentOpts.verbose);

    // Load awards
    const raw = await readFile(options.input as string, "utf-8");
    const awards: NormalizedAward[] = JSON.parse(raw);
    logger.info({ count: awards.length, input: options.input }, "Loaded awards");

    // Initialize engine
    const engine = new SignalEngine();
    const filter = options.indicators
      ? (options.indicators as string).split(",")
      : undefined;
    engine.initialize(config, filter);

    // Process
    engine.processAwards(awards);
    const result = engine.finalize();

    // Output
    if (options.format === "json") {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log(`\nSignal Analysis Results`);
      console.log(`${"─".repeat(60)}`);
      console.log(
        `Indicators run: ${result.summary.totalIndicatorsRun} | ` +
        `Signals found: ${result.summary.totalSignals}`,
      );
      console.log(
        `  High: ${result.summary.signalsBySeverity.high ?? 0} | ` +
        `Medium: ${result.summary.signalsBySeverity.medium ?? 0} | ` +
        `Low: ${result.summary.signalsBySeverity.low ?? 0}`,
      );
      console.log(`${"─".repeat(60)}`);

      for (const signal of result.signals) {
        const icon =
          signal.severity === "high" ? "[HIGH]" :
          signal.severity === "medium" ? "[MED] " : "[LOW] ";
        console.log(`\n${icon} ${signal.indicatorName} (${signal.indicatorId})`);
        console.log(`  Entity: ${signal.entityName}`);
        console.log(`  ${signal.context}`);
        console.log(`  Awards: ${signal.affectedAwards.length}`);
      }

      // Metadata
      console.log(`\n${"─".repeat(60)}`);
      console.log("Data Coverage:");
      for (const meta of result.metadata) {
        console.log(
          `  ${meta.id} ${meta.name}: ${meta.dataCoverage.recordsWithRequiredFields}/${meta.dataCoverage.totalRecords} records (${meta.dataCoverage.coveragePercent.toFixed(0)}%)`,
        );
      }
    }
  });
