import { describe, it, expect } from "vitest";
import { loadConfig } from "../../src/cli/config.js";

describe("AppConfig", () => {
  it("should load with all defaults when no config file", async () => {
    // loadConfig with no path searches for config files; in test env it should
    // find config/default.yaml or fall back to defaults
    const config = await loadConfig();

    expect(config.api.baseUrl).toBe("https://api.usaspending.gov/api/v2");
    expect(config.api.requestsPerSecond).toBe(2);
    expect(config.api.maxRetries).toBe(3);
    expect(config.api.pageSize).toBe(100);
    expect(config.cache.enabled).toBe(true);
    expect(config.cache.directory).toBe(".cache");
    expect(config.ai.enabled).toBe(true);
  });

  it("should have all signal indicators enabled by default", async () => {
    const config = await loadConfig();

    expect(config.signals.R001_single_bid.enabled).toBe(true);
    expect(config.signals.R002_non_competitive.enabled).toBe(true);
    expect(config.signals.R003_splitting.enabled).toBe(true);
    expect(config.signals.R004_concentration.enabled).toBe(true);
    expect(config.signals.R005_modifications.enabled).toBe(true);
    expect(config.signals.R006_price_outliers.enabled).toBe(true);
  });

  it("should have correct default thresholds", async () => {
    const config = await loadConfig();

    expect(config.signals.R001_single_bid.severityThreshold).toBe(0.2);
    expect(config.signals.R003_splitting.thresholds).toEqual([250000, 7500000]);
    expect(config.signals.R003_splitting.bandWidthPct).toBe(0.1);
    expect(config.signals.R004_concentration.vendorShareThreshold).toBe(0.3);
    expect(config.signals.R005_modifications.maxModificationCount).toBe(5);
    expect(config.signals.R006_price_outliers.method).toBe("iqr");
  });
});
