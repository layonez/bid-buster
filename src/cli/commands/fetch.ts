/**
 * Fetch command: data collection from USAspending API.
 * Handles pagination, caching, detail enrichment, and snapshot creation.
 */
import { Command } from "commander";
import { loadConfig } from "../config.js";
import { createLogger } from "../../shared/logger.js";

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
  .option("--with-details", "Fetch individual award details (slower)", false)
  .option(
    "--with-transactions",
    "Fetch modification history (slower)",
    false,
  )
  .action(async (options) => {
    const parentOpts = options.parent?.parent?.opts() ?? {};
    const config = await loadConfig(parentOpts.config);
    const logger = createLogger(parentOpts.verbose);

    const [periodStart, periodEnd] = (options.period as string).split(":");

    logger.info(
      {
        agency: options.agency,
        recipient: options.recipient,
        period: { start: periodStart, end: periodEnd },
        withDetails: options.withDetails,
        withTransactions: options.withTransactions,
      },
      "Starting data collection",
    );

    // TODO: Phase 2 - implement collector
    // 1. Build search filters from CLI options
    // 2. Paginate through spending_by_award
    // 3. Optionally fetch award details
    // 4. Optionally fetch transaction history
    // 5. Normalize and cache results
    // 6. Create snapshot with provenance

    logger.info("Collector agent not yet implemented.");
  });
