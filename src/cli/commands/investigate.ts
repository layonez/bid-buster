/**
 * Main investigation command: runs the full pipeline.
 * Collector → Signaler → Hypothesis → Prover → Narrator → Verifier → case folder
 */
import { Command } from "commander";
import { loadConfig } from "../config.js";
import { createLogger } from "../../shared/logger.js";
import { runInvestigation } from "../../orchestrator/pipeline.js";

export const investigateCommand = new Command("run")
  .description("Run a full investigation pipeline")
  .option("--agency <name>", "Agency name (e.g., 'Department of Defense')")
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
  .option("--with-transactions", "Fetch modification history for R005 indicator", false)
  .action(async (options) => {
    if (!options.agency && !options.recipient) {
      console.error("Error: At least one of --agency or --recipient is required.");
      process.exit(1);
    }

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
      { withTransactions: options.withTransactions },
    );

    console.log(`\nCase folder: ${casePath}`);
    console.log(`  case.md              - Investigation report`);
    console.log(`  signals.json         - Red-flag signals`);
    console.log(`  hypotheses.json      - Generated hypotheses`);
    console.log(`  awards.json          - Normalized award data`);
    console.log(`  evidence-manifest.json - Evidence artifact references`);
    console.log(`  evidence/            - CSV evidence tables`);
    console.log(`  verification.json    - Claim verification results`);
    console.log(`  provenance.json      - Run metadata & audit trail`);
  });
