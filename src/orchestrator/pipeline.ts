/**
 * Investigation pipeline orchestrator.
 * Runs the sequential agent pipeline: Collector → Signaler → Hypothesis → Prover → Verifier → Narrator
 *
 * Will be fully implemented in Phase 6.
 */
import type { AppConfig } from "../cli/config.js";
import type {
  InvestigationParams,
  InvestigationContext,
} from "../shared/types.js";
import { createProvenance } from "../shared/provenance.js";
import type pino from "pino";

export class InvestigationPipeline {
  constructor(
    private config: AppConfig,
    private logger: pino.Logger,
  ) {}

  async run(params: InvestigationParams): Promise<InvestigationContext> {
    const context: InvestigationContext = {
      params,
      startTime: new Date(),
      signals: [],
      hypotheses: [],
      evidence: [],
      verificationResults: [],
      provenance: createProvenance(params as unknown as Record<string, unknown>),
    };

    this.logger.info(
      { agency: params.agency, recipient: params.recipient },
      "Pipeline starting",
    );

    // Phase 2: Collector
    this.logger.info("Step 1/6: Collecting data...");
    // TODO: await this.collect(context);

    // Phase 3: Signaler
    this.logger.info("Step 2/6: Computing signals...");
    // TODO: await this.computeSignals(context);

    // Phase 4: Hypothesis Maker
    this.logger.info("Step 3/6: Generating hypotheses...");
    // TODO: await this.generateHypotheses(context);

    // Phase 4: Prover
    this.logger.info("Step 4/6: Producing evidence...");
    // TODO: await this.produceEvidence(context);

    // Phase 5: Verifier
    this.logger.info("Step 5/6: Verifying claims...");
    // TODO: await this.verifyClaims(context);

    // Phase 5: Narrator
    this.logger.info("Step 6/6: Assembling report...");
    // TODO: await this.assembleReport(context);

    this.logger.info("Pipeline complete.");
    return context;
  }
}
