/**
 * Main investigation command: runs the full pipeline.
 * Collector → Signaler → Hypothesis → Narrator → case folder
 */
import { Command } from "commander";
import { loadConfig } from "../config.js";
import { createLogger } from "../../shared/logger.js";
import { runInvestigation } from "../../orchestrator/pipeline.js";

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
    const parentOpts = options.parent?.parent?.opts() ?? {};
    const config = await loadConfig(parentOpts.config);
    const logger = createLogger(parentOpts.verbose);

    if (parentOpts.cache === false) {
      config.cache.enabled = false;
    }

    const [periodStart, periodEnd] = (options.period as string).split(":");
    const outputDir = (parentOpts.output as string) ?? "./cases";

    const casePath = await runInvestigation(
      {
        agency: options.agency,
        recipient: options.recipient,
        periodStart,
        periodEnd,
        outputDir,
        awardTypeCodes: (options.awardTypes as string).split(","),
      },
      config,
      logger,
    );

    console.log(`\nCase folder: ${casePath}`);
    console.log(`  case.md          - Investigation report`);
    console.log(`  signals.json     - Red-flag signals`);
    console.log(`  hypotheses.json  - Generated hypotheses`);
    console.log(`  awards.json      - Normalized award data`);
    console.log(`  provenance.json  - Run metadata`);
  });
