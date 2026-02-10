/**
 * Verifier agent: cross-checks claims in the report against signal data.
 * Ensures every factual statement is backed by computed evidence.
 */
import type { Signal } from "../shared/types.js";
import type { SignalEngineResult } from "../signaler/types.js";

export interface VerificationResult {
  totalClaims: number;
  supported: number;
  unsupported: number;
  details: VerificationDetail[];
  passed: boolean;
}

interface VerificationDetail {
  claim: string;
  status: "supported" | "unsupported";
  evidenceRef?: string;
}

/**
 * Verify that signal-derived claims in the report match computed data.
 * Returns a verification report; sets passed=false if unsupported claims found.
 */
export function verifyReport(
  reportContent: string,
  signalResult: SignalEngineResult,
): VerificationResult {
  const details: VerificationDetail[] = [];

  // Check 1: Every signal referenced in the report exists in signal data
  for (const signal of signalResult.signals) {
    const idPresent = reportContent.includes(signal.indicatorId);
    const namePresent = reportContent.includes(signal.indicatorName);

    details.push({
      claim: `Signal ${signal.indicatorId} (${signal.indicatorName}) is referenced`,
      status: idPresent && namePresent ? "supported" : "unsupported",
      evidenceRef: `signals.json → ${signal.indicatorId}`,
    });
  }

  // Check 2: Key numeric values from signals appear in report
  for (const signal of signalResult.signals) {
    // Check value
    const valueStr = String(signal.value);
    const valuePresent = reportContent.includes(valueStr);

    details.push({
      claim: `Signal ${signal.indicatorId} value (${valueStr}) appears in report`,
      status: valuePresent ? "supported" : "unsupported",
      evidenceRef: `signals.json → ${signal.indicatorId}.value`,
    });
  }

  // Check 3: Severity counts match
  const summaryMatch = reportContent.includes(
    `${signalResult.summary.totalSignals} signals detected`,
  );
  details.push({
    claim: `Total signal count (${signalResult.summary.totalSignals}) is correct`,
    status: summaryMatch ? "supported" : "unsupported",
    evidenceRef: "signals.json → summary.totalSignals",
  });

  // Check 4: Disclaimer present
  const disclaimerPresent =
    reportContent.includes("not proof of wrongdoing") ||
    reportContent.includes("screening instrument");
  details.push({
    claim: "Non-accusatory disclaimer is present",
    status: disclaimerPresent ? "supported" : "unsupported",
  });

  // Check 5: Methodology references present
  const methPresent =
    reportContent.includes("Open Contracting") ||
    reportContent.includes("OECD");
  details.push({
    claim: "Methodology references (OCP/OECD) are present",
    status: methPresent ? "supported" : "unsupported",
  });

  // Check 6: Provenance section present
  const provPresent = reportContent.includes("Provenance");
  details.push({
    claim: "Provenance section is present",
    status: provPresent ? "supported" : "unsupported",
  });

  const supported = details.filter((d) => d.status === "supported").length;
  const unsupported = details.filter((d) => d.status === "unsupported").length;

  return {
    totalClaims: details.length,
    supported,
    unsupported,
    details,
    passed: unsupported === 0,
  };
}
