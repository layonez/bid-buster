/**
 * Main investigation command: runs the full 8-step pipeline.
 * Collect → Signal → Investigate → Hypothesize → Prove → Enhance → Report+Dashboard → Verify
 */
import { Command } from "commander";
import { loadConfig } from "../config.js";
import { createLogger } from "../../shared/logger.js";
import { runInvestigation } from "../../orchestrator/pipeline.js";
import { exec } from "node:child_process";
import { join } from "node:path";

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
  .option("--deep", "Enable Opus 4.6 investigative agent for multi-source analysis", false)
  .option("--charts", "Generate Vega-Lite SVG charts in evidence/", true)
  .option("--no-charts", "Disable chart generation")
  .option("--no-ai", "Disable all AI features (template-only output)")
  .option("--full-evidence", "Include full detail evidence CSVs (larger output)", false)
  .option("--open", "Auto-open dashboard.html in browser after completion", false)
  .action(async (options, command) => {
    if (!options.agency && !options.recipient) {
      console.error("Error: At least one of --agency or --recipient is required.");
      process.exit(1);
    }

    const parentOpts = command.parent?.opts() ?? {};
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
      {
        withTransactions: options.withTransactions,
        deep: options.deep,
        charts: options.charts,
        noAi: options.ai === false,
        fullEvidence: options.fullEvidence,
      },
    );

    console.log(`\nCase folder: ${casePath}`);
    console.log(`  README.md            - Executive briefing (start here)`);
    console.log(`  case.md              - Full investigation report`);
    console.log(`  dashboard.html       - Interactive HTML dashboard`);
    console.log(`  evidence/            - CSV evidence tables + SVG charts`);
    console.log(`  data/                - JSON data files (signals, awards, findings)`);
    console.log(`  provenance.json      - Run metadata & audit trail`);

    if (options.deep) {
      console.log(`  investigation-narrative.md - Agent reasoning trace`);
    }

    // Auto-open dashboard if requested
    if (options.open) {
      const dashboardPath = join(casePath, "dashboard.html");
      const cmd = process.platform === "darwin"
        ? `open "${dashboardPath}"`
        : process.platform === "win32"
          ? `start "" "${dashboardPath}"`
          : `xdg-open "${dashboardPath}"`;

      exec(cmd, (err) => {
        if (err) {
          console.log(`\nCould not auto-open dashboard. Open manually: ${dashboardPath}`);
        }
      });
    }
  });
