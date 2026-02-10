/**
 * Main investigation command: runs the full pipeline.
 * Collector → Signaler → Hypothesis → Prover → Verifier → Narrator
 */
import { Command } from "commander";
import { loadConfig } from "../config.js";
import { createLogger } from "../../shared/logger.js";

export const investigateCommand = new Command("run")
  .description("Run a full investigation pipeline")
  .requiredOption("--agency <name>", "Agency name or code")
  .option("--recipient <name>", "Recipient name or UEI")
  .option(
    "--period <range>",
    "Date range (YYYY-MM-DD:YYYY-MM-DD)",
    `2020-01-01:${new Date().getFullYear()}-12-31`,
  )
  .option(
    "--award-types <codes>",
    "Award type codes (comma-separated)",
    "A,B,C,D",
  )
  .action(async (options) => {
    const parentOpts = options.parent?.opts() ?? {};
    const config = await loadConfig(parentOpts.config);
    const logger = createLogger(parentOpts.verbose);

    const [periodStart, periodEnd] = (options.period as string).split(":");

    logger.info(
      {
        agency: options.agency,
        recipient: options.recipient,
        period: { start: periodStart, end: periodEnd },
      },
      "Starting full investigation",
    );

    // TODO: Phase 2+ - wire up pipeline
    // 1. Collector: fetch + cache + normalize
    // 2. Signaler: compute indicators → signal table
    // 3. Hypothesis Maker: generate questions from signals
    // 4. Prover: produce evidence artifacts
    // 5. Verifier: validate all claims
    // 6. Narrator: assemble case.md

    logger.info(
      "Full pipeline not yet implemented. Use `fetch` and `signal` subcommands for now.",
    );
  });
