/**
 * Structured logging with pino.
 */
import pino from "pino";

export function createLogger(verbose?: boolean): pino.Logger {
  return pino({
    level: verbose ? "debug" : "info",
    transport: {
      target: "pino/file",
      options: { destination: 2 }, // stderr
    },
    formatters: {
      level(label) {
        return { level: label };
      },
    },
    timestamp: pino.stdTimeFunctions.isoTime,
  });
}
