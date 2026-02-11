/**
 * Fetch command: data collection from USAspending API.
 */
import { Command } from "commander";
import { loadConfig } from "../config.js";
import { createLogger } from "../../shared/logger.js";
import { runCollector } from "../../collector/index.js";

export const fetchCommand = new Command("fetch")
  .description("Collect procurement data from USAspending API")
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
  .option("--page-limit <n>", "Maximum pages to fetch", "100")
  .option("--with-details", "Fetch individual award details", false)
  .option("--with-transactions", "Fetch modification history", false)
  .action(async (options, command) => {
    const parentOpts = command.parent?.opts() ?? {};
    const config = await loadConfig(parentOpts.config);
    const logger = createLogger(parentOpts.verbose);

    if (parentOpts.cache === false) {
      config.cache.enabled = false;
    }

    const [periodStart, periodEnd] = (options.period as string).split(":");

    const result = await runCollector(
      {
        agency: options.agency,
        recipient: options.recipient,
        periodStart,
        periodEnd,
        awardTypeCodes: (options.awardTypes as string).split(","),
        withDetails: options.withDetails,
        withTransactions: options.withTransactions,
        pageLimit: parseInt(options.pageLimit as string, 10),
      },
      config,
      logger,
    );

    // Print summary to stdout
    console.log(`\nCollection complete:`);
    console.log(`  Awards: ${result.awards.length}`);
    console.log(`  Details fetched: ${result.raw.awardDetails.size}`);
    console.log(`  Transactions fetched: ${result.raw.transactions.size}`);
    console.log(`  Cache hits: ${result.raw.cacheHits}`);
    console.log(`  Snapshot: ${result.snapshotDir}/awards.json`);
  });
