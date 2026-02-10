#!/usr/bin/env node
/**
 * Procurement Investigator CLI
 * Investigation-as-Code: Turn public procurement data into auditable integrity reports.
 */
import { Command } from "commander";
import { investigateCommand } from "./commands/investigate.js";
import { fetchCommand } from "./commands/fetch.js";
import { signalCommand } from "./commands/signal.js";

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

program.parse();
