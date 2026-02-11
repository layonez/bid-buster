/**
 * Interactive HTML dashboard generator.
 * Produces a self-contained single-file dashboard.html with:
 * - Truncated inline JSON data (top 50 signals, material-findings-only hypotheses)
 * - Vega-Lite charts rendered client-side via Vega-Embed (CDN)
 * - Material findings section, signal table, hypothesis cards, evidence links, provenance trail
 * - Full data available in data/*.json sidecar files
 */
import type { DashboardData, Signal, Hypothesis, EvidenceArtifact, MaterialFinding, ConvergenceEntity } from "../shared/types.js";

// ─── Constants ───────────────────────────────────────────────────────────────

const SIGNAL_PAGE_SIZE = 50;
const SIGNAL_CONTEXT_MAX_LENGTH = 120;
const SEVERITY_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 };

// ─── HTML Escaping (XSS Prevention) ────────────────────────────────────────

const HTML_ESCAPE_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

function escapeHtml(str: string): string {
  return str.replace(/[&<>"']/g, (ch) => HTML_ESCAPE_MAP[ch]);
}

function escapeJsonForScript(obj: unknown): string {
  // JSON embedded in <script> must escape </script and <!-- sequences
  return JSON.stringify(obj)
    .replace(/<\//g, "<\\/")
    .replace(/<!--/g, "<\\!--");
}

// ─── Data Truncation Helpers ────────────────────────────────────────────────

function sortSignalsBySeverity(signals: Signal[]): Signal[] {
  return [...signals].sort((a, b) =>
    (SEVERITY_ORDER[a.severity] ?? 9) - (SEVERITY_ORDER[b.severity] ?? 9),
  );
}

function getMaterialHypothesisIds(
  hypotheses: Hypothesis[],
  materialFindings: MaterialFinding[] | undefined,
): Set<string> {
  if (!materialFindings || materialFindings.length === 0) return new Set(hypotheses.map((h) => h.id));
  const ids = new Set<string>();
  for (const finding of materialFindings) {
    for (const h of hypotheses) {
      if (h.id === "H-EXECUTIVE") continue;
      // Match by indicator ID in signal IDs and entity name in hypothesis ID
      const matchesIndicator = h.signalIds.some((sid) => sid === finding.indicatorId);
      const matchesEntity = h.id.includes(finding.entityName.slice(0, 10).toUpperCase().replace(/[^A-Z0-9]/g, ""));
      if (matchesIndicator && matchesEntity) {
        ids.add(h.id);
      }
    }
  }
  return ids;
}

// ─── Dashboard Builder ──────────────────────────────────────────────────────

/**
 * Build a complete self-contained HTML dashboard from investigation data.
 * Opens in any browser — all dependencies loaded from CDN, all data inline.
 * Data is truncated for size: top 50 signals, material-findings hypotheses only.
 * Full data is in data/*.json sidecar files.
 */
export function buildDashboard(data: DashboardData): string {
  const {
    title,
    generatedAt,
    params,
    signals,
    hypotheses,
    evidence,
    charts,
    provenance,
    investigationFindings,
    materialFindings,
    convergenceEntities,
  } = data;

  const awardCount = data.awards.length;
  const allNonExec = hypotheses.filter((h) => h.id !== "H-EXECUTIVE");
  const execHypothesis = hypotheses.find((h) => h.id === "H-EXECUTIVE");
  const highCount = signals.filter((s) => s.severity === "high").length;
  const mediumCount = signals.filter((s) => s.severity === "medium").length;
  const lowCount = signals.filter((s) => s.severity === "low").length;

  // Truncate: sort signals by severity, take top 50 for rendering
  const sortedSignals = sortSignalsBySeverity(signals);
  const displaySignals = sortedSignals.slice(0, SIGNAL_PAGE_SIZE);

  // Truncate: only hypotheses matching material findings
  const materialHypIds = getMaterialHypothesisIds(allNonExec, materialFindings);
  const displayHypotheses = allNonExec.filter((h) => materialHypIds.has(h.id));
  const truncatedHypotheses = materialFindings && materialFindings.length > 0 && displayHypotheses.length < allNonExec.length;

  // Truncate: only evidence for displayed hypotheses
  const displayHypIdSet = new Set(displayHypotheses.map((h) => h.id));
  const displayEvidence = evidence.filter((e) => displayHypIdSet.has(e.hypothesisId));

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)} — Procurement Investigation Dashboard</title>
${buildStyles()}
<script src="https://cdn.jsdelivr.net/npm/vega@5"></script>
<script src="https://cdn.jsdelivr.net/npm/vega-lite@5"></script>
<script src="https://cdn.jsdelivr.net/npm/vega-embed@6"></script>
</head>
<body>

<!-- ─── Header ─────────────────────────────────────────────────────────── -->
<header class="header">
  <div class="container">
    <h1>${escapeHtml(title)}</h1>
    <div class="header-meta">
      ${params.agency ? `<span class="meta-tag">Agency: ${escapeHtml(params.agency)}</span>` : ""}
      ${params.recipient ? `<span class="meta-tag">Recipient: ${escapeHtml(params.recipient)}</span>` : ""}
      <span class="meta-tag">Period: ${escapeHtml(params.periodStart)} to ${escapeHtml(params.periodEnd)}</span>
      <span class="meta-tag">Generated: ${escapeHtml(generatedAt)}</span>
    </div>
  </div>
</header>

<!-- ─── Disclaimer ─────────────────────────────────────────────────────── -->
<div class="container">
  <div class="disclaimer">
    <strong>Disclaimer:</strong> This report is a screening instrument. Red flags are
    indicators that warrant further investigation by competent authorities. They are
    <strong>not proof of wrongdoing</strong>. Unusual patterns may have legitimate
    explanations. (OECD Guidelines for Fighting Bid Rigging, 2025; OCP Red Flags Guide, 2024)
  </div>

  <!-- ─── Executive Summary ──────────────────────────────────────────── -->
  <section class="section">
    <h2>Executive Summary</h2>
    <div class="summary-cards">
      <div class="summary-card">
        <div class="summary-value">${signals.length}</div>
        <div class="summary-label">Signals Detected</div>
      </div>
      <div class="summary-card card-high">
        <div class="summary-value">${highCount}</div>
        <div class="summary-label">High Severity</div>
      </div>
      <div class="summary-card card-medium">
        <div class="summary-value">${mediumCount}</div>
        <div class="summary-label">Medium Severity</div>
      </div>
      <div class="summary-card card-low">
        <div class="summary-value">${lowCount}</div>
        <div class="summary-label">Low Severity</div>
      </div>
      <div class="summary-card">
        <div class="summary-value">${awardCount}</div>
        <div class="summary-label">Awards Analyzed</div>
      </div>
      <div class="summary-card">
        <div class="summary-value">${allNonExec.length}</div>
        <div class="summary-label">Hypotheses</div>
      </div>
    </div>
    ${execHypothesis ? `<div class="exec-summary">${escapeHtml(execHypothesis.context)}</div>` : ""}
    ${investigationFindings ? `<div class="exec-summary"><strong>Investigator Assessment:</strong> ${escapeHtml(investigationFindings.summary)}</div>` : ""}
  </section>

  <!-- ─── Convergence Analysis ─────────────────────────────────────── -->
  ${convergenceEntities && convergenceEntities.length > 0 ? buildConvergenceSection(convergenceEntities) : ""}

  <!-- ─── Material Findings ────────────────────────────────────────── -->
  ${materialFindings && materialFindings.length > 0 ? buildMaterialFindingsSection(materialFindings) : ""}

  <!-- ─── Signal Table ───────────────────────────────────────────────── -->
  <section class="section">
    <h2>Signals Detected</h2>
    ${displaySignals.length > 0 ? buildSignalTable(displaySignals, signals.length) : '<p class="empty-state">No signals detected.</p>'}
  </section>

  <!-- ─── Charts ─────────────────────────────────────────────────────── -->
  ${charts.length > 0 ? buildChartsSection(charts) : ""}

  <!-- ─── Hypotheses ─────────────────────────────────────────────────── -->
  <section class="section">
    <h2>Hypotheses &amp; Evidence</h2>
    ${truncatedHypotheses ? `<p class="truncation-note">Showing ${displayHypotheses.length} hypotheses matching material findings. ${allNonExec.length} total generated — see <code>data/hypotheses.json</code> for the complete list.</p>` : ""}
    ${displayHypotheses.length > 0
      ? displayHypotheses.map((h, i) => buildHypothesisCard(h, displayEvidence, i)).join("\n    ")
      : '<p class="empty-state">No hypotheses generated.</p>'}
  </section>

  <!-- ─── Evidence Links ─────────────────────────────────────────────── -->
  <section class="section">
    <h2>Evidence Artifacts</h2>
    ${displayEvidence.length > 0 ? buildEvidenceTable(displayEvidence, evidence.length) : '<p class="empty-state">No evidence artifacts.</p>'}
  </section>

  <!-- ─── Investigation Details ──────────────────────────────────────── -->
  ${investigationFindings ? buildInvestigationSection(investigationFindings) : ""}

  <!-- ─── Provenance ─────────────────────────────────────────────────── -->
  <section class="section provenance">
    <h2>Provenance &amp; Audit Trail</h2>
    <div class="provenance-grid">
      <div class="prov-item"><strong>Generated:</strong> ${escapeHtml(provenance.timestamp)}</div>
      <div class="prov-item"><strong>Tool Version:</strong> ${escapeHtml(provenance.toolVersion)}</div>
      ${provenance.gitCommit ? `<div class="prov-item"><strong>Git Commit:</strong> <code>${escapeHtml(provenance.gitCommit)}</code></div>` : ""}
      <div class="prov-item"><strong>Node.js:</strong> ${escapeHtml(provenance.nodeVersion)}</div>
      ${provenance.dataSources.map((ds) => `
      <div class="prov-item"><strong>Source:</strong> ${escapeHtml(ds.name)} — ${ds.recordCount} records (${ds.cacheHit ? "cached" : "live"}, ${escapeHtml(ds.snapshotDate)})</div>`).join("")}
    </div>
    <details class="prov-details">
      <summary>Run Parameters</summary>
      <pre><code>${escapeHtml(JSON.stringify(provenance.parameters, null, 2))}</code></pre>
    </details>
  </section>

  <!-- ─── Footer ─────────────────────────────────────────────────────── -->
  <footer class="footer">
    <p>Generated by <strong>Procurement Investigator</strong> (Investigation-as-Code)</p>
    <p>Methodology: OCP Red Flags Guide (2024) &middot; OECD Bid Rigging Guidelines (2025)</p>
  </footer>
</div>

<!-- ─── Inline Data (truncated for size; full data in data/*.json) ────── -->
<script>
  window.__DASHBOARD_DATA__ = ${escapeJsonForScript({
    title: data.title,
    generatedAt: data.generatedAt,
    params: data.params,
    signals: displaySignals.map((s) => ({ ...s, context: truncateContext(s.context) })),
    totalSignalCount: signals.length,
    hypotheses: displayHypotheses.map((h) => ({
      id: h.id, signalIds: h.signalIds, question: h.question,
      context: h.context.slice(0, 300),
      evidenceNeeded: h.evidenceNeeded.slice(0, 3),
      severity: h.severity,
    })),
    totalHypothesisCount: allNonExec.length,
    evidence: displayEvidence.map((e) => ({ id: e.id, hypothesisId: e.hypothesisId, type: e.type, title: e.title, filePath: e.filePath })),
    totalEvidenceCount: evidence.length,
    charts: charts.map((c) => ({ id: c.id, title: c.title, description: c.description })),
    provenance: { timestamp: data.provenance.timestamp, toolVersion: data.provenance.toolVersion, gitCommit: data.provenance.gitCommit },
    materialFindings: (materialFindings ?? []).map((f) => ({
      id: f.id, entityName: f.entityName, indicatorId: f.indicatorId, indicatorName: f.indicatorName,
      severity: f.severity, materialityScore: f.materialityScore, totalDollarValue: f.totalDollarValue,
      signalCount: f.signalCount, affectedAwardIds: f.affectedAwardIds.slice(0, 10),
      fiveCs: f.fiveCs, aiTag: f.aiTag, entityContext: f.entityContext,
    })),
    convergenceEntities: (convergenceEntities ?? []).map((ce) => ({
      entityName: ce.entityName, indicators: ce.indicators,
      totalExposure: ce.totalExposure, convergenceScore: ce.convergenceScore,
      findingCount: ce.findings.length,
    })),
    investigationFindings: data.investigationFindings
      ? {
          summary: data.investigationFindings.summary,
          iterations: data.investigationFindings.iterations,
          toolCallCount: data.investigationFindings.toolCallLog.length,
          crossReferences: data.investigationFindings.crossReferences,
          estimatedCostUsd: data.investigationFindings.estimatedCostUsd,
        }
      : undefined,
    awardCount: data.awards.length,
  })};
</script>

<!-- ─── Chart Rendering ──────────────────────────────────────────────── -->
${buildChartScripts(charts)}

<!-- ─── Interactivity ────────────────────────────────────────────────── -->
<script>
  document.querySelectorAll('.hypothesis-card .card-header').forEach(function(header) {
    header.addEventListener('click', function() {
      var card = header.parentElement;
      card.classList.toggle('collapsed');
    });
  });
</script>

</body>
</html>`;
}

// ─── Section Builders ───────────────────────────────────────────────────────

function buildMaterialFindingsSection(findings: MaterialFinding[]): string {
  const cards = findings.map((f) => {
    const sevClass = `card-${f.severity}`;
    const badge = severityBadge(f.severity);
    const tag = f.aiTag ? `<span class="ai-tag ai-tag-${f.aiTag.toLowerCase().replace(/[^a-z]/g, "")}">${escapeHtml(f.aiTag)}</span>` : "";
    const exposure = `$${f.totalDollarValue.toLocaleString()}`;

    const fiveCsHtml = f.fiveCs
      ? `<div class="five-cs">
          <div class="five-c"><strong>Condition:</strong> ${escapeHtml(f.fiveCs.condition)}</div>
          <div class="five-c"><strong>Criteria:</strong> ${escapeHtml(f.fiveCs.criteria)}</div>
          <div class="five-c"><strong>Cause:</strong> ${escapeHtml(f.fiveCs.cause)}</div>
          <div class="five-c"><strong>Effect:</strong> ${escapeHtml(f.fiveCs.effect)}</div>
          <div class="five-c recommendation"><strong>Recommendation:</strong> ${escapeHtml(f.fiveCs.recommendation)}</div>
        </div>`
      : `<p>${escapeHtml(truncateContext(f.signals[0]?.context ?? ""))}</p>`;

    // Entity context metadata line
    const entityCtxHtml = f.entityContext
      ? buildEntityContextHtml(f.entityContext)
      : "";

    return `<div class="finding-card ${sevClass}">
      <div class="finding-header">
        <span class="finding-id">${escapeHtml(f.id)}</span>
        ${badge}
        ${tag}
        <span class="finding-title">${escapeHtml(f.indicatorName)} — ${escapeHtml(f.entityName)}</span>
      </div>
      ${entityCtxHtml}
      <div class="finding-stats">
        <span class="stat"><strong>Exposure:</strong> ${exposure}</span>
        <span class="stat"><strong>Awards:</strong> ${f.affectedAwardIds.length}</span>
        <span class="stat"><strong>Signals:</strong> ${f.signalCount}</span>
      </div>
      ${fiveCsHtml}
    </div>`;
  }).join("\n    ");

  return `<section class="section">
    <h2>Material Findings</h2>
    <p class="section-subtitle">${findings.length} findings ranked by materiality (dollar exposure × severity × signal count)</p>
    ${cards}
  </section>`;
}

function buildEntityContextHtml(ctx: NonNullable<MaterialFinding["entityContext"]>): string {
  const parts: string[] = [];
  if (ctx.naicsDescription) parts.push(escapeHtml(ctx.naicsDescription));
  if (ctx.setAsideType) parts.push(`Set-aside: ${escapeHtml(ctx.setAsideType)}`);
  parts.push(`${ctx.totalAwardsInDataset} awards in dataset`);
  if (ctx.firstAwardDate && ctx.lastAwardDate) {
    parts.push(`active ${escapeHtml(ctx.firstAwardDate)} to ${escapeHtml(ctx.lastAwardDate)}`);
  }
  return `<div class="entity-context">${parts.join(" · ")}</div>`;
}

function buildConvergenceSection(entities: ConvergenceEntity[]): string {
  const rows = entities
    .map((ce) => {
      const indicators = ce.indicators
        .map((id) => `<code>${escapeHtml(id)}</code>`)
        .join(" ");
      const exposure = `$${ce.totalExposure.toLocaleString()}`;
      const barWidth = Math.min(100, Math.round((ce.indicators.length / 6) * 100));
      return `<tr>
        <td><strong>${escapeHtml(ce.entityName)}</strong></td>
        <td>${indicators}</td>
        <td class="num">${ce.indicators.length}</td>
        <td class="num">${exposure}</td>
        <td class="num">${ce.findings.length}</td>
        <td><div class="convergence-bar" style="width: ${barWidth}%"></div></td>
      </tr>`;
    })
    .join("\n");

  return `<section class="section">
    <h2>Multi-Signal Entities</h2>
    <p class="section-subtitle">Entities flagged by 2+ independent indicators — strongest investigative leads</p>
    <div class="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Entity</th>
            <th>Indicators</th>
            <th>#</th>
            <th>Exposure</th>
            <th>Findings</th>
            <th>Convergence</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  </section>`;
}

function buildSignalTable(signals: Signal[], totalCount: number): string {
  const rows = signals
    .map((s, i) => {
      const badge = severityBadge(s.severity);
      return `<tr>
        <td>${i + 1}</td>
        <td>${badge}</td>
        <td><code>${escapeHtml(s.indicatorId)}</code> ${escapeHtml(s.indicatorName)}</td>
        <td>${escapeHtml(s.entityName)}</td>
        <td class="num">${s.value}</td>
        <td class="num">${s.threshold}</td>
        <td>${escapeHtml(truncateContext(s.context))}</td>
      </tr>`;
    })
    .join("\n");

  const truncationNote = totalCount > signals.length
    ? `<p class="truncation-note">Showing top ${signals.length} of ${totalCount} signals (sorted by severity). See <code>data/signals.json</code> for the complete list.</p>`
    : "";

  return `<div class="table-wrapper">
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Severity</th>
          <th>Indicator</th>
          <th>Entity</th>
          <th>Value</th>
          <th>Threshold</th>
          <th>Context</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  </div>
  ${truncationNote}`;
}

function buildChartsSection(charts: { id: string; title: string; description: string }[]): string {
  const chartDivs = charts
    .map(
      (c) => `<div class="chart-container">
        <h3>${escapeHtml(c.title)}</h3>
        <p class="chart-desc">${escapeHtml(c.description)}</p>
        <div id="chart-${escapeHtml(c.id)}" class="chart-render"></div>
      </div>`,
    )
    .join("\n    ");

  return `<section class="section">
    <h2>Visual Evidence</h2>
    <div class="charts-grid">
      ${chartDivs}
    </div>
  </section>`;
}

function buildHypothesisCard(
  h: Hypothesis,
  evidence: EvidenceArtifact[],
  _index: number,
): string {
  const relatedEvidence = evidence.filter((e) => e.hypothesisId === h.id);
  const badge = severityBadge(h.severity);

  const evidenceLinks = relatedEvidence.length > 0
    ? `<div class="evidence-links">
        <strong>Supporting Evidence:</strong>
        <ul>${relatedEvidence.map((e) => `<li><a href="${escapeHtml(e.filePath)}">${escapeHtml(e.title)}</a> — ${escapeHtml(e.description)}</li>`).join("")}</ul>
      </div>`
    : "";

  const evidenceNeeded = h.evidenceNeeded.length > 0
    ? `<div class="evidence-needed">
        <strong>Evidence Needed for Further Review:</strong>
        <ul>${h.evidenceNeeded.map((e) => `<li>${escapeHtml(e)}</li>`).join("")}</ul>
      </div>`
    : "";

  return `<div class="hypothesis-card">
      <div class="card-header">
        <span class="card-id">${escapeHtml(h.id)}</span>
        ${badge}
        <span class="card-question">${escapeHtml(h.question)}</span>
        <span class="card-toggle">&#9660;</span>
      </div>
      <div class="card-body">
        <p class="card-signals">Triggered by: ${h.signalIds.map((id) => `<code>${escapeHtml(id)}</code>`).join(", ")}</p>
        <div class="card-context">${escapeHtml(h.context)}</div>
        ${evidenceLinks}
        ${evidenceNeeded}
      </div>
    </div>`;
}

function buildEvidenceTable(evidence: EvidenceArtifact[], totalCount: number): string {
  const rows = evidence
    .map(
      (e) => `<tr>
        <td><code>${escapeHtml(e.id)}</code></td>
        <td>${escapeHtml(e.hypothesisId)}</td>
        <td><span class="type-badge type-${escapeHtml(e.type)}">${escapeHtml(e.type.toUpperCase())}</span></td>
        <td><a href="${escapeHtml(e.filePath)}">${escapeHtml(e.title)}</a></td>
        <td>${escapeHtml(e.description)}</td>
      </tr>`,
    )
    .join("\n");

  const truncationNote = totalCount > evidence.length
    ? `<p class="truncation-note">Showing ${evidence.length} of ${totalCount} evidence artifacts (matching material findings). See <code>data/evidence-manifest.json</code> for the complete list.</p>`
    : "";

  return `<div class="table-wrapper">
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Hypothesis</th>
          <th>Type</th>
          <th>Title</th>
          <th>Description</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  </div>
  ${truncationNote}`;
}

function buildInvestigationSection(findings: NonNullable<DashboardData["investigationFindings"]>): string {
  const crossRefs = findings.crossReferences.length > 0
    ? `<h3>Cross-References</h3>
      <div class="table-wrapper">
        <table>
          <thead><tr><th>Source A</th><th>Source B</th><th>Finding</th><th>Impact</th></tr></thead>
          <tbody>${findings.crossReferences.map((cr) => `<tr>
            <td><code>${escapeHtml(cr.sourceA)}</code></td>
            <td><code>${escapeHtml(cr.sourceB)}</code></td>
            <td>${escapeHtml(cr.finding)}</td>
            <td><span class="impact-${cr.impact}">${escapeHtml(cr.impact)}</span></td>
          </tr>`).join("")}</tbody>
        </table>
      </div>`
    : "";

  const toolLog = findings.toolCallLog.length > 0
    ? `<details class="prov-details">
        <summary>Tool Call Log (${findings.toolCallLog.length} calls)</summary>
        <div class="table-wrapper">
          <table>
            <thead><tr><th>Tool</th><th>Duration</th><th>Cache</th><th>Error</th></tr></thead>
            <tbody>${findings.toolCallLog.map((tc) => `<tr>
              <td><code>${escapeHtml(tc.toolName)}</code></td>
              <td class="num">${tc.durationMs}ms</td>
              <td>${tc.cacheHit ? "&#10003;" : "&#10007;"}</td>
              <td>${tc.error ? escapeHtml(tc.error) : "—"}</td>
            </tr>`).join("")}</tbody>
          </table>
        </div>
      </details>`
    : "";

  return `<section class="section">
    <h2>Investigation Details</h2>
    <div class="summary-cards">
      <div class="summary-card">
        <div class="summary-value">${findings.iterations}</div>
        <div class="summary-label">Agent Iterations</div>
      </div>
      <div class="summary-card">
        <div class="summary-value">${findings.toolCallLog.length}</div>
        <div class="summary-label">Tool Calls</div>
      </div>
      <div class="summary-card">
        <div class="summary-value">$${findings.estimatedCostUsd.toFixed(2)}</div>
        <div class="summary-label">Estimated Cost</div>
      </div>
    </div>
    ${crossRefs}
    ${toolLog}
  </section>`;
}

/**
 * Truncate chart spec inline data to a max sample size for dashboard embedding.
 * Charts are already rendered as SVGs; the inline Vega-Embed is for interactive
 * exploration and doesn't need all 10K points -- a representative sample suffices.
 */
const CHART_DATA_SAMPLE_LIMIT = 500;

function truncateChartSpec(spec: Record<string, unknown>): Record<string, unknown> {
  const clone = JSON.parse(JSON.stringify(spec)) as Record<string, unknown>;

  // Direct data.values
  if (clone.data && typeof clone.data === "object") {
    const d = clone.data as Record<string, unknown>;
    if (Array.isArray(d.values) && d.values.length > CHART_DATA_SAMPLE_LIMIT) {
      d.values = d.values.slice(0, CHART_DATA_SAMPLE_LIMIT);
    }
  }

  // Layer specs (e.g., threshold clustering has multiple layers)
  if (Array.isArray(clone.layer)) {
    for (const layer of clone.layer) {
      if (layer && typeof layer === "object") {
        const l = layer as Record<string, unknown>;
        if (l.data && typeof l.data === "object") {
          const d = l.data as Record<string, unknown>;
          if (Array.isArray(d.values) && d.values.length > CHART_DATA_SAMPLE_LIMIT) {
            d.values = d.values.slice(0, CHART_DATA_SAMPLE_LIMIT);
          }
        }
      }
    }
  }

  return clone;
}

function buildChartScripts(charts: { id: string; spec: Record<string, unknown> }[]): string {
  if (charts.length === 0) return "";

  const embedCalls = charts
    .map(
      (c) =>
        `  vegaEmbed('#chart-${c.id}', ${escapeJsonForScript(truncateChartSpec(c.spec))}, {actions: {source: false, compiled: false}}).catch(function(err) { console.warn('Chart ${c.id}:', err); });`,
    )
    .join("\n");

  return `<script>
  document.addEventListener('DOMContentLoaded', function() {
    if (typeof vegaEmbed === 'undefined') {
      document.querySelectorAll('.chart-render').forEach(function(el) {
        el.innerHTML = '<p class="chart-fallback">Charts require an internet connection to load Vega-Lite from CDN.</p>';
      });
      return;
    }
${embedCalls}
  });
</script>`;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function truncateContext(context: string): string {
  if (context.length <= SIGNAL_CONTEXT_MAX_LENGTH) return context;
  return context.slice(0, SIGNAL_CONTEXT_MAX_LENGTH - 3) + "...";
}

function severityBadge(severity: string): string {
  return `<span class="severity severity-${escapeHtml(severity)}">${escapeHtml(severity.toUpperCase())}</span>`;
}

// ─── Styles ─────────────────────────────────────────────────────────────────

function buildStyles(): string {
  return `<style>
  :root {
    --color-bg: #f8f9fb;
    --color-surface: #ffffff;
    --color-border: #dde1e6;
    --color-text: #1a1f36;
    --color-text-muted: #5e6687;
    --color-primary: #3b5998;
    --color-primary-light: #e8edf5;
    --color-high: #c0392b;
    --color-high-bg: #fdf0ef;
    --color-medium: #e67e22;
    --color-medium-bg: #fef6ec;
    --color-low: #2980b9;
    --color-low-bg: #edf4fb;
    --color-confirms: #27ae60;
    --color-refutes: #c0392b;
    --color-contextualizes: #2980b9;
    --radius: 6px;
    --shadow: 0 1px 3px rgba(0,0,0,0.08);
  }
  *, *::before, *::after { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    font-size: 14px;
    line-height: 1.6;
    color: var(--color-text);
    background: var(--color-bg);
  }
  .container { max-width: 1200px; margin: 0 auto; padding: 0 24px 48px; }
  a { color: var(--color-primary); text-decoration: none; }
  a:hover { text-decoration: underline; }
  code { font-family: "SF Mono", Consolas, "Liberation Mono", Menlo, monospace; font-size: 0.9em; background: var(--color-primary-light); padding: 1px 5px; border-radius: 3px; }
  pre { background: #f0f2f5; padding: 16px; border-radius: var(--radius); overflow-x: auto; font-size: 12px; }
  h1 { margin: 0; font-size: 1.6em; font-weight: 700; }
  h2 { font-size: 1.25em; font-weight: 600; color: var(--color-text); margin: 0 0 16px; padding-bottom: 8px; border-bottom: 2px solid var(--color-border); }
  h3 { font-size: 1.05em; font-weight: 600; margin: 0 0 8px; }

  /* Header */
  .header { background: var(--color-primary); color: #fff; padding: 28px 0 20px; margin-bottom: 24px; }
  .header .container { padding-bottom: 0; }
  .header h1 { color: #fff; font-size: 1.5em; }
  .header-meta { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
  .meta-tag { background: rgba(255,255,255,0.18); padding: 3px 10px; border-radius: 12px; font-size: 0.85em; }

  /* Disclaimer */
  .disclaimer { background: #fffbeb; border: 1px solid #f5d060; border-left: 4px solid #f5a623; padding: 14px 18px; border-radius: var(--radius); margin-bottom: 24px; font-size: 0.9em; color: #6b5900; }

  /* Sections */
  .section { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius); padding: 24px; margin-bottom: 20px; box-shadow: var(--shadow); }
  .section-subtitle { color: var(--color-text-muted); font-size: 0.9em; margin: -8px 0 16px; }

  /* Summary cards */
  .summary-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 12px; margin-bottom: 16px; }
  .summary-card { background: var(--color-bg); border: 1px solid var(--color-border); border-radius: var(--radius); padding: 16px; text-align: center; }
  .summary-card.card-high { border-color: var(--color-high); background: var(--color-high-bg); }
  .summary-card.card-medium { border-color: var(--color-medium); background: var(--color-medium-bg); }
  .summary-card.card-low { border-color: var(--color-low); background: var(--color-low-bg); }
  .summary-value { font-size: 1.8em; font-weight: 700; line-height: 1.2; }
  .summary-label { font-size: 0.8em; color: var(--color-text-muted); margin-top: 4px; text-transform: uppercase; letter-spacing: 0.03em; }

  .exec-summary { background: var(--color-primary-light); padding: 14px 18px; border-radius: var(--radius); margin-top: 12px; line-height: 1.7; white-space: pre-wrap; }

  /* Truncation notes */
  .truncation-note { color: var(--color-text-muted); font-size: 0.85em; font-style: italic; margin-top: 12px; }

  /* Tables */
  .table-wrapper { overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; font-size: 0.9em; }
  th, td { padding: 8px 12px; text-align: left; border-bottom: 1px solid var(--color-border); }
  th { background: var(--color-bg); font-weight: 600; white-space: nowrap; position: sticky; top: 0; }
  td.num { text-align: right; font-variant-numeric: tabular-nums; }
  tbody tr:hover { background: #f5f7fa; }

  /* Severity badges */
  .severity { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 0.75em; font-weight: 700; letter-spacing: 0.04em; }
  .severity-high { background: var(--color-high-bg); color: var(--color-high); }
  .severity-medium { background: var(--color-medium-bg); color: var(--color-medium); }
  .severity-low { background: var(--color-low-bg); color: var(--color-low); }

  /* Type badges */
  .type-badge { display: inline-block; padding: 1px 6px; border-radius: 3px; font-size: 0.75em; font-weight: 600; }
  .type-csv { background: #e8f5e9; color: #2e7d32; }
  .type-chart { background: #e3f2fd; color: #1565c0; }
  .type-json { background: #fff3e0; color: #e65100; }
  .type-table { background: #f3e5f5; color: #7b1fa2; }

  /* AI tag badges */
  .ai-tag { display: inline-block; padding: 1px 6px; border-radius: 3px; font-size: 0.7em; font-weight: 600; margin-left: 4px; }
  .ai-tag-rule { background: #e8f5e9; color: #2e7d32; }
  .ai-tag-aienhanced { background: #e3f2fd; color: #1565c0; }
  .ai-tag-aidiscovered { background: #fff3e0; color: #e65100; }

  /* Impact badges */
  .impact-confirms { color: var(--color-confirms); font-weight: 600; }
  .impact-refutes { color: var(--color-refutes); font-weight: 600; }
  .impact-contextualizes { color: var(--color-contextualizes); font-weight: 600; }

  /* Material Finding cards */
  .finding-card { border: 1px solid var(--color-border); border-radius: var(--radius); padding: 16px; margin-bottom: 12px; }
  .finding-card.card-high { border-left: 4px solid var(--color-high); background: var(--color-high-bg); }
  .finding-card.card-medium { border-left: 4px solid var(--color-medium); background: var(--color-medium-bg); }
  .finding-card.card-low { border-left: 4px solid var(--color-low); background: var(--color-low-bg); }
  .finding-header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; flex-wrap: wrap; }
  .finding-id { font-family: monospace; font-size: 0.85em; color: var(--color-primary); font-weight: 600; }
  .finding-title { font-weight: 500; flex: 1; }
  .finding-stats { display: flex; gap: 16px; font-size: 0.9em; margin-bottom: 12px; flex-wrap: wrap; }
  .finding-stats .stat { white-space: nowrap; }
  .entity-context { font-size: 0.8em; color: var(--color-text-muted); margin-bottom: 8px; font-style: italic; }
  .five-cs { font-size: 0.9em; line-height: 1.7; }
  .five-c { margin-bottom: 6px; }
  .five-c.recommendation { background: rgba(255,255,255,0.5); padding: 8px 12px; border-radius: var(--radius); margin-top: 8px; }

  /* Convergence */
  .convergence-bar { height: 8px; background: var(--color-primary); border-radius: 4px; min-width: 4px; }

  /* Charts */
  .charts-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 20px; }
  .chart-container { background: var(--color-bg); border: 1px solid var(--color-border); border-radius: var(--radius); padding: 16px; }
  .chart-desc { color: var(--color-text-muted); font-size: 0.85em; margin: 0 0 12px; }
  .chart-render { min-height: 200px; }
  .chart-fallback { color: var(--color-text-muted); font-style: italic; text-align: center; padding: 40px 0; }

  /* Hypothesis cards */
  .hypothesis-card { border: 1px solid var(--color-border); border-radius: var(--radius); margin-bottom: 12px; overflow: hidden; }
  .card-header { display: flex; align-items: center; gap: 10px; padding: 12px 16px; background: var(--color-bg); cursor: pointer; user-select: none; }
  .card-header:hover { background: #eef1f6; }
  .card-id { font-family: monospace; font-size: 0.85em; color: var(--color-primary); font-weight: 600; white-space: nowrap; }
  .card-question { flex: 1; font-weight: 500; }
  .card-toggle { font-size: 0.7em; color: var(--color-text-muted); transition: transform 0.2s; }
  .hypothesis-card.collapsed .card-body { display: none; }
  .hypothesis-card.collapsed .card-toggle { transform: rotate(-90deg); }
  .card-body { padding: 16px; border-top: 1px solid var(--color-border); }
  .card-signals { font-size: 0.85em; color: var(--color-text-muted); margin: 0 0 12px; }
  .card-context { line-height: 1.7; white-space: pre-wrap; margin-bottom: 12px; }
  .evidence-links, .evidence-needed { margin-top: 12px; }
  .evidence-links ul, .evidence-needed ul { margin: 6px 0 0; padding-left: 20px; }
  .evidence-links li, .evidence-needed li { margin-bottom: 4px; font-size: 0.9em; }

  /* Provenance */
  .provenance-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 8px; margin-bottom: 12px; }
  .prov-item { font-size: 0.9em; }
  .prov-details { margin-top: 8px; }
  .prov-details summary { cursor: pointer; font-weight: 500; color: var(--color-primary); font-size: 0.9em; }

  /* Footer */
  .footer { text-align: center; padding: 24px 0 0; font-size: 0.8em; color: var(--color-text-muted); border-top: 1px solid var(--color-border); margin-top: 8px; }
  .footer p { margin: 4px 0; }

  .empty-state { color: var(--color-text-muted); font-style: italic; }

  /* Responsive */
  @media (max-width: 768px) {
    .container { padding: 0 12px 32px; }
    .section { padding: 16px; }
    .summary-cards { grid-template-columns: repeat(3, 1fr); }
    .charts-grid { grid-template-columns: 1fr; }
    .header h1 { font-size: 1.2em; }
    table { font-size: 0.8em; }
    th, td { padding: 6px 8px; }
  }
  @media (max-width: 480px) {
    .summary-cards { grid-template-columns: repeat(2, 1fr); }
    .header-meta { flex-direction: column; }
  }
</style>`;
}
