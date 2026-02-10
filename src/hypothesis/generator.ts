/**
 * Hypothesis generator.
 * Uses templates and optionally enhances with Claude API.
 */
import Anthropic from "@anthropic-ai/sdk";
import type { Signal, Hypothesis } from "../shared/types.js";
import { generateHypothesesFromTemplates } from "./templates.js";
import type pino from "pino";

export interface HypothesisGeneratorOptions {
  aiEnabled: boolean;
  model: string;
  logger: pino.Logger;
}

export async function generateHypotheses(
  signals: Signal[],
  options: HypothesisGeneratorOptions,
): Promise<Hypothesis[]> {
  // Always start with template-based hypotheses
  const hypotheses = generateHypothesesFromTemplates(signals);

  if (!options.aiEnabled || signals.length === 0) {
    return hypotheses;
  }

  // Enhance with Claude if available
  try {
    const client = new Anthropic();

    const signalSummary = signals
      .map((s) => `- [${s.severity.toUpperCase()}] ${s.indicatorName}: ${s.context}`)
      .join("\n");

    const response = await client.messages.create({
      model: options.model,
      max_tokens: 1024,
      system:
        "You are a procurement integrity analyst. Your role is to help interpret red-flag " +
        "indicators in public procurement data. You must maintain a strictly non-accusatory tone. " +
        "Red flags are screening indicators that warrant further investigation, not proof of wrongdoing. " +
        "Always suggest innocent explanations alongside risk interpretations. Be concise.",
      messages: [
        {
          role: "user",
          content:
            `The following red-flag signals were detected in procurement data:\n\n${signalSummary}\n\n` +
            `Please provide a brief (2-3 sentence) executive assessment of these findings. ` +
            `Note any patterns across signals and suggest what a reviewer should prioritise. ` +
            `Maintain non-accusatory language throughout.`,
        },
      ],
    });

    const aiContent =
      response.content[0].type === "text" ? response.content[0].text : "";

    if (aiContent) {
      // Add AI assessment as a meta-hypothesis
      hypotheses.unshift({
        id: "H-EXECUTIVE",
        signalIds: signals.map((s) => s.indicatorId),
        question: "What do these signals collectively suggest?",
        context: aiContent,
        evidenceNeeded: [
          "Cross-reference all evidence artifacts below",
        ],
        severity: signals[0].severity,
      });
    }

    options.logger.info("AI-enhanced hypothesis generated");
  } catch (err) {
    options.logger.warn(
      { error: (err as Error).message },
      "AI enhancement unavailable, using templates only",
    );
  }

  return hypotheses;
}
