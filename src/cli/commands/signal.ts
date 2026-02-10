/**
 * Signal command: compute red-flag indicators from cached data.
 */
import { Command } from "commander";
import { loadConfig } from "../config.js";
import { createLogger } from "../../shared/logger.js";

export const signalCommand = new Command("signal")
  .description("Compute red-flag indicators from cached procurement data")
  .requiredOption("--input <dir>", "Path to cached/normalized data directory")
  .option(
    "--indicators <ids>",
    "Comma-separated indicator IDs to run (default: all enabled)",
  )
  .option("--format <type>", "Output format: table, json", "table")
  .action(async (options) => {
    const parentOpts = options.parent?.parent?.opts() ?? {};
    const config = await loadConfig(parentOpts.config);
    const logger = createLogger(parentOpts.verbose);

    logger.info(
      {
        input: options.input,
        indicators: options.indicators,
        format: options.format,
      },
      "Starting signal computation",
    );

    // TODO: Phase 3 - implement signaler
    // 1. Load normalized awards from input directory
    // 2. Initialize enabled indicators
    // 3. Fold each award through each indicator
    // 4. Finalize and collect signals
    // 5. Output signal table

    logger.info("Signaler agent not yet implemented.");
  });
