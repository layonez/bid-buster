/**
 * Server-side SVG rendering for Vega-Lite charts.
 * Compiles Vega-Lite specs to Vega, renders via View API with 'none' renderer.
 * No node-canvas dependency required.
 */
import type { TopLevelSpec } from "vega-lite";

/**
 * Render a Vega-Lite spec to SVG string.
 * Uses 'none' renderer (server-side SVG, no canvas needed).
 */
export async function renderChartToSvg(spec: TopLevelSpec): Promise<string> {
  // Dynamic import to allow graceful fallback if vega not installed
  const vl = await import("vega-lite");
  const vega = await import("vega");

  // Compile Vega-Lite to Vega spec
  const compiled = vl.compile(spec);

  // Parse Vega spec to runtime
  const runtime = vega.parse(compiled.spec);

  // Create view with 'none' renderer (SVG output, no canvas)
  const view = new vega.View(runtime, { renderer: "none" as const });

  // Render to SVG
  const svg = await view.toSVG();

  // Clean up
  view.finalize();

  return svg;
}
