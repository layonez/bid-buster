# Procurement Investigator (Investigation‑as‑Code)

## Scope & Problem Framing

*   **Purpose:** Build a command‑line tool (`investigate`) that converts slices of public procurement data into an **auditable case file**. The goal is to support human decision‑makers by surfacing risk **signals** and evidence, not to accuse anyone. Each case file clearly separates:
    *   **Signals / anomalies** – quantitative indicators suggesting potential integrity issues.
    *   **Hypotheses** – narrative prompts generated from the signals (e.g., “Are contract amounts unusually concentrated among a few suppliers?”).
    *   **Evidence** – reproducible tables, charts and linked underlying records.
    *   **Open questions / next steps** – items that require human follow‑up.
*   **Process model:** Organise the case file around the procurement lifecycle (tender → award → contract → implementation) so that the analysis stays coherent and extensible to Open Contracting Data Standard (OCDS) datasets.[1] This structure lets users drill down by buyer, supplier and project.
*   **Non‑accusatory posture:** Follow guidance from organisations like the OECD and UNODC by framing the tool as a screening instrument. Red flags are prompts for further review, not proof of wrongdoing. For example, the OECD’s 2025 bid‑rigging guidelines emphasise that unusual bidding or pricing patterns should be reported to competition authorities but require careful investigation before drawing conclusions[2].

## Data Ingestion & Snapshotting (MVP)

*   **Primary feed:** Use the **USAspending API**, starting with the *Advanced Award Search* endpoint (`/api/v2/search/spending_by_award/`). Community tutorials confirm that the endpoint returns **100 results per page**[3], so the ingestion client must paginate through the desired timeframe. Accept both GET and POST requests; build payloads as JSON, including filters and fields.
*   **Pagination & rate‑limits:** The API doesn’t document strict rate limits, so design defensively: throttle requests, back off on HTTP 429 codes and checkpoint progress. Expose `--page-limit` and `--max-retries` options in the CLI.
*   **Bulk download fallback:** For very large data slices or unstable pagination, support USAspending’s bulk download endpoints. The client should download raw ZIP/CSV files, record the request parameters and extract the relevant subset offline.
*   **Caching & reproducibility:** Store every request payload and response in a `queries/` folder (JSON files keyed by timestamp and parameters). Cache responses locally so repeated runs do not hit the API unnecessarily. Freeze snapshots (e.g., as of a given date) so evidence remains reproducible.

## Red‑Flag Library & Hypothesis→Proof Loop

*   **Rule pack:** Implement a configurable red‑flag library based on recognised integrity indicators. The Open Contracting Partnership’s 2024 red‑flags guide offers a catalogue of 73 indicators with definitions and formulas[4]; choose 8–12 that are most feasible with USAspending fields (e.g., limited competition, contract amendments, clustering of awards). Each rule should be parameterised (thresholds, period windows) so that it can be tuned for context.
*   **Cardinal integration (optional):** The OCP’s Cardinal library calculates procurement risk indicators from OCDS data. Cardinal analyses dataset coverage, cleans data, and calculates red flags[5]. For OCDS‑formatted inputs, the MVP could call Cardinal’s CLI and ingest its outputs.
*   **Hypothesis→proof engine:**
    *   **Generate hypotheses:** After computing signals, automatically draft narrative hypotheses (e.g., “Supplier X won a disproportionate share of contracts during FY2023”). Use templated language drawn from “red flags” guidance to avoid accusatory tone.
    *   **Prove/falsify:** For each hypothesis, run targeted queries or aggregations (e.g., distribution of award amounts by supplier) and produce dataframes/charts.
    *   **Verification pass:** Check that each claim in the narrative is supported by at least one evidence artifact. If not, flag it for manual review.

## Evidence, Auditability & Repo Layout

*   **Case repository:** Each run of `investigate` produces a folder with:
    *   `case.md` – narrative report: executive summary, signals, hypotheses, evidence overview, open questions.
    *   `evidence/` – CSV/JSON extracts and charts referenced in the report.
    *   `queries/` – raw API request payloads and responses.
    *   `analysis/` – notebooks or scripts used to generate the evidence. Capture deterministic seeds and version info for reproducibility.
    *   `provenance.json` – metadata describing the run (timestamp, commit hash, API versions, tool versions).
*   **Traceability:** The report uses footnote‑style links to point each statement to specific evidence (table row IDs, chart names) and underlying record IDs. Where possible, include permanent identifiers (award IDs, agency codes) so external reviewers can cross‑check via the original API.

## Enrichment Connectors (Stretch Goals)

*   **Entity context:** The SAM.gov Entity Management API exposes public, FOUO (controlled unclassified), and sensitive data. The public level includes names, unique identifiers, addresses and business types[6]. Use the public mode to enrich award recipient data (e.g., verifying UEI and business classifications). Note that the API returns 10 records per page and is limited to the first 10 000 records[7].
*   **Sanctions & watchlists:** The OpenSanctions API aggregates sanctions lists, politically exposed persons (PEPs) and other watchlists. Microsoft’s connector documentation summarises that the API lets users match, search or fetch entities, explore relationships, and analyse dataset coverage[8]. Use fuzzy matching to screen suppliers against sanctions and PEP lists.
*   **Beneficial ownership:** Open Contracting notes that corruption schemes often rely on shell companies and that combining open contracting data with beneficial ownership information helps detect corruption and money‑laundering risks[9]. OpenOwnership’s prototype Open Ownership Register was retired in November 2024, but public beneficial ownership datasets are still downloadable through [bods-data.openownership.org](https://bods-data.openownership.org)[10]. In later iterations, parse BODS files and join them to award recipients by company identifiers.

## Agentic Workflow & Roles

To make the investigation process demonstrably novel, design the software as a set of sub‑agents (skills) with clear responsibilities:

1.  **Collector:** Handles data ingestion from USAspending (and enrichment APIs), including pagination, caching, rate‑limit handling and snapshotting.
2.  **Signaler:** Computes red‑flag indicators from the dataset slice and outputs a structured list of signals.
3.  **Hypothesis Maker:** Generates narrative hypotheses based on the signals, using pre‑defined language templates and ethical guidelines.
4.  **Prover:** Produces analysis code (e.g., SQL queries, Python/Pandas scripts) to test each hypothesis, summarising results into tables or charts.
5.  **Verifier:** Checks that every narrative statement in `case.md` is backed by evidence; fails the build if unsupported claims remain.
6.  **Narrator:** Assembles the `case.md` report, ensuring the structure (signals → hypotheses → evidence → next steps) and including context, caveats and references.

These agents can be orchestrated within Claude Code (the development environment) using subagent hooks, allowing parallel development and modular testing. Claude Opus 4.6 supports agent teams and long‑context tasks; it provides a 1M‑token context window and features like context compaction to summarise state for long‑running workflows[11][12].

## MVP User Flow

1.  **Setup:** The user installs the package and obtains API keys for USAspending (if required), SAM.gov and OpenSanctions (optional). They configure `investigate` via a `config.yaml` (default thresholds, caching location, API keys).
2.  **Run the investigation:**
3.  The user invokes `investigate --agency=<name or code> --period=<start:end> [--recipient=<vendor name or UEI>]`.
4.  **Collector** retrieves award records matching the filters, paginating 100 results per page[3], and caches raw responses.
5.  If specified, the collector also fetches enrichment data from SAM.gov and OpenSanctions.
6.  **Compute signals:** **Signaler** runs the red‑flag rules against the dataset slice and produces a table of flags (indicator ID, affected entity, value, threshold, context). Rules are configurable via `config.yaml`.
7.  **Draft hypotheses:** **Hypothesis Maker** converts the signals into plain‑language questions, referencing established methodologies (e.g., “short submission period” or “unusual bid prices” as defined in the red‑flags guide[4]). It ensures language emphasises possibility rather than guilt.
8.  **Analyse evidence:** **Prover** generates scripts/queries to calculate descriptive statistics and cross‑tabs needed to assess each hypothesis (e.g., distribution of award amounts by supplier; timeline of contract modifications). The outputs are stored in `evidence/`.
9.  **Verify narrative:** **Verifier** scans `case.md` and cross‑checks every claim against an evidence file; if a claim lacks support, it reports an error for revision.
10. **Assemble report:** **Narrator** writes `case.md` with sections for summary, signals, hypotheses, evidence, and open questions. The report includes footnotes linking each statement to evidence files and raw record IDs. It closes with a disclaimer emphasising that the findings are screening indicators, not definitive proof[2].

## Ethical & Safety Considerations

*   **Screening vs accusation:** Always remind users that red flags are indicators; unusual patterns warrant further investigation by competent authorities. Avoid language implying guilt or misconduct. Cite OECD guidance that red flags (e.g., unusual bidding patterns) are meant to alert officials and should be checked with competition authorities[2].
*   **Data quality & false positives:** Emphasise that procurement data often have missing or inconsistent fields. The OCP’s red‑flags guide includes notes on data quality and context dependencies[4]. Provide fields in the rule pack to set minimum coverage thresholds before raising indicators.
*   **Privacy & sensitivity:** Only ingest publicly available data. When using the SAM.gov API, restrict to the “Public” sensitivity level[6]. Do not expose personal data (e.g., addresses) in reports; summarise at organisation level where possible.

## Future Extensions

*   **More indicators:** Expand the rule pack beyond the initial 8–12 signals, drawing from the full catalogue of 73 indicators[4] and Cardinal’s library of 10 indicators (with more planned)[13].
*   **Interactive dashboards:** After generating the case repository, automatically build dashboards (e.g., in Streamlit or Observable) that visualise award distributions, supplier networks and timelines.
*   **Cross‑jurisdictional data:** Adapt the ingestion layer to handle OCDS‑formatted datasets from other countries. Use the OCP’s data registry to locate datasets[14].
*   **Beneficial ownership & network analysis:** Integrate BODS‑formatted beneficial ownership datasets; use entity resolution to link suppliers to ultimate owners and build network graphs of relationships.
*   **Automated messaging:** Provide report‑export options (e.g., PDF, HTML) and notifications when new signals arise for a given agency or supplier.

---

### Citations

All factual statements above are supported by publicly available sources:
*   The USAspending `spending_by_award` endpoint returns a maximum of 100 results per page, requiring pagination[3].
*   The Open Contracting Partnership’s red‑flags guide offers a methodology and a list of 73 indicators[4].
*   OCP’s Cardinal library provides coverage analysis, data cleaning and calculation of red‑flag indicators, supporting 10 indicators with plans for more[5].
*   OECD’s 2025 guidelines emphasise that red flags (e.g., unusual bidding patterns) should be understood and reported but require further investigation[2].
*   The SAM.gov Entity Management API distinguishes between public, FOUO and sensitive data; the public level exposes names, UEIs and business details, and returns 10 records per page[7].
*   Microsoft’s documentation summarises that the OpenSanctions API allows searching and matching entities within a global sanctions and PEP database[8].
*   Open Contracting highlights that combining procurement data with beneficial ownership information helps detect corruption and money‑laundering risks[9]; the Open Ownership Register closed in 2024, but public datasets remain available via bods-data.openownership.org[10].
*   The “Investigating public contracts” guide notes that public procurement represents one‑third of government spending and provides tips and resources for investigating buyers, companies and projects[1].

[1] [14] Investigating public contracts - Open Contracting Partnership
https://www.open-contracting.org/implement/investigating-public-contracts/

[2] OECD Guidelines for Fighting Bid Rigging in Public Procurement (2025 Update) | OECD
https://www.oecd.org/en/publications/2025/09/oecd-guidelines-for-fighting-bid-rigging-in-public-procurement-2025-update_127880ea.html

[3] 6 Getting Data Using APIs – Lecture Notes for AU DATA 413-613 Data Science
https://rressler.quarto.pub/data-413-613/06_getting_data_apis_main.html

[4] Red Flags in Public Procurement. A guide to using data to detect and mitigate risks - Open Contracting Partnership
https://www.open-contracting.org/resources/red-flags-in-public-procurement-a-guide-to-using-data-to-detect-and-mitigate-risks/

[5] [13] Cardinal, an open-source library to calculate public procurement red flags - Open Contracting Partnership
https://www.open-contracting.org/2024/06/12/cardinal-an-open-source-library-to-calculate-public-procurement-red-flags/

[6] [7] SAM.gov Entity Management API | GSA Open Technology
https://open.gsa.gov/api/entity-api/

[8] OpenSanctions (Independent Publisher) - Connectors | Microsoft Learn
https://learn.microsoft.com/en-us/connectors/opensanctions/

[9] Beneficial Ownership - Open Contracting Partnership
https://www.open-contracting.org/what-is-open-contracting/beneficial-ownership/

[10] Open Ownership Register | openownership.org
https://www.openownership.org/en/topics/open-ownership-register/

[11] [12] Claude Opus 4.6 \ Anthropic
https://www.anthropic.com/news/claude-opus-4-6