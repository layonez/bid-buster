/**
 * AI-enhanced narrative generation.
 * Uses Claude to refine each hypothesis with richer context,
 * innocent explanations, and structured analysis.
 */
import Anthropic from "@anthropic-ai/sdk";
import type pino from "pino";
import type { Signal, Hypothesis } from "../shared/types.js";
import type { SignalEngineResult } from "../signaler/types.js";

export interface EnhancerOptions {
  aiEnabled: boolean;
  model: string;
  logger: pino.Logger;
}

/**
 * Enhance hypothesis narratives with AI-generated analysis.
 * Falls back gracefully to original hypotheses if AI is unavailable.
 */
export async function enhanceNarrative(
  hypotheses: Hypothesis[],
  signalResult: SignalEngineResult,
  options: EnhancerOptions,
): Promise<Hypothesis[]> {
  if (!options.aiEnabled || hypotheses.length === 0) {
    return hypotheses;
  }

  let client: Anthropic;
  try {
    client = new Anthropic();
  } catch {
    options.logger.warn("AI client initialization failed, using template narratives");
    return hypotheses;
  }

  const enhanced: Hypothesis[] = [];

  for (const hypothesis of hypotheses) {
    // Skip executive summary -- it's already AI-generated
    if (hypothesis.id === "H-EXECUTIVE") {
      enhanced.push(hypothesis);
      continue;
    }

    try {
      const enriched = await enhanceSingleHypothesis(
        client,
        hypothesis,
        signalResult,
        options,
      );
      enhanced.push(enriched);
    } catch (err) {
      options.logger.warn(
        { hypothesisId: hypothesis.id, error: (err as Error).message },
        "AI enhancement failed for hypothesis, using template",
      );
      enhanced.push(hypothesis);
    }
  }

  return enhanced;
}

async function enhanceSingleHypothesis(
  client: Anthropic,
  hypothesis: Hypothesis,
  signalResult: SignalEngineResult,
  options: EnhancerOptions,
): Promise<Hypothesis> {
  const relatedSignals = signalResult.signals.filter((s) =>
    hypothesis.signalIds.includes(s.indicatorId),
  );

  const signalDetails = relatedSignals
    .map((s) => `  - [${s.severity.toUpperCase()}] ${s.indicatorName}: ${s.context}`)
    .join("\n");

  const metadata = signalResult.metadata
    .filter((m) => hypothesis.signalIds.includes(m.id))
    .map((m) => `  - ${m.id} ${m.name}: ${m.dataCoverage.coveragePercent.toFixed(0)}% data coverage`)
    .join("\n");

  const response = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 384,
    system:
      "You are a procurement integrity analyst writing for an auditable case report. " +
      "Your role is to provide balanced, non-accusatory analysis of procurement red flags. " +
      "Rules:\n" +
      "1. NEVER use words like corrupt, fraud, guilty, criminal, or illegal.\n" +
      "2. Always present innocent explanations alongside risk interpretations.\n" +
      "3. Frame findings as questions that warrant further review.\n" +
      "4. Reference specific data points from the signals provided.\n" +
      "5. Keep analysis concise (3-5 sentences).\n" +
      "6. Note any data quality limitations.",
    messages: [
      {
        role: "user",
        content:
          `Hypothesis: ${hypothesis.question}\n\n` +
          `Template analysis: ${hypothesis.context}\n\n` +
          `Supporting signals:\n${signalDetails}\n\n` +
          `Data quality:\n${metadata}\n\n` +
          `Please refine the analysis with:\n` +
          `1. A concise, data-grounded interpretation of the pattern\n` +
          `2. At least one plausible innocent explanation\n` +
          `3. What a reviewer should examine next\n` +
          `Keep it to 3-5 sentences. Maintain non-accusatory tone throughout.`,
      },
    ],
  });

  const aiText =
    response.content[0].type === "text" ? response.content[0].text : "";

  if (!aiText) return hypothesis;

  options.logger.info({ hypothesisId: hypothesis.id }, "Hypothesis enhanced with AI narrative");

  return {
    ...hypothesis,
    context: aiText,
    aiEnhanced: true,
  };
}
