#!/usr/bin/env node
/**
 * Procurement Investigator CLI
 * Investigation-as-Code: Turn public procurement data into auditable integrity reports.
 */
import { Command } from "commander";
import { investigateCommand } from "./commands/investigate.js";
import { fetchCommand } from "./commands/fetch.js";
import { signalCommand } from "./commands/signal.js";
import { createLogger } from "../shared/logger.js";

const program = new Command();

program
  .name("investigate")
  .description(
    "Procurement Investigator: Turn public spending data into auditable integrity reports",
  )
  .version("0.1.0")
  .option("-c, --config <path>", "Path to config file")
  .option("-o, --output <dir>", "Output directory", "./cases")
  .option("-v, --verbose", "Enable verbose logging")
  .option("--dry-run", "Show what would happen without making API calls")
  .option("--no-cache", "Disable cache and force fresh API calls");

program.addCommand(investigateCommand);
program.addCommand(fetchCommand);
program.addCommand(signalCommand);

// Default action: run full investigation
program
  .argument("[agency]", "Agency name or code to investigate")
  .option("--agency <name>", "Agency name or code")
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
  .action(async (agency, options) => {
    const parentOpts = program.opts();
    const logger = createLogger(parentOpts.verbose);

    const agencyName = options.agency ?? agency;
    if (!agencyName) {
      logger.info(
        "No agency specified. Use --agency or provide as argument.",
      );
      logger.info("Example: investigate --agency=\"Department of Defense\"");
      logger.info("Run `investigate --help` for all options.");
      program.help();
      return;
    }

    logger.info({ agency: agencyName }, "Starting investigation");
    logger.info(
      "Full investigation pipeline not yet implemented. Use subcommands:",
    );
    logger.info("  investigate fetch   - Collect data from USAspending");
    logger.info("  investigate signal  - Compute red-flag indicators");
  });

program.parse();
