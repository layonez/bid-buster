# Reference Repositories (for Coding Agent)

This folder tracks upstream projects we use for **code discovery** and **design inspiration** while implementing **Procurement Investigator (Investigation-as-Code)**.

We reference these repos for three distinct needs:
1) **Indicator / red-flags computation** (core signals library)
2) **Robust ingestion + snapshotting** (repeatable evidence capture)
3) **CLI + OCDS data handling utilities** (packaging, upgrading, validation helpers)

## 1) Cardinal (Rust) — `open-contracting/cardinal-rs`
Repo: https://github.com/open-contracting/cardinal-rs

### Why it’s useful
- Directly aligned with our goal: **compute procurement indicators / red flags** from OCDS-shaped data.
- Provides a **reference taxonomy** of indicators and a practical approach to implementing them as code.

### What to look for
- Indicator definitions: naming, parameters, thresholds, caveats.
- Data model assumptions: what fields are required, what missingness is expected.
- Output formats: how results are reported (per contracting process, buyer, supplier, etc.).
- Testing patterns for deterministic computation.

### How we might use it
- Use as the baseline for our **Rule Pack** structure (even if our MVP uses USAspending first).
- Mirror indicator module boundaries and add an adapter layer:
  - `USAspending -> normalized schema -> indicator engine`
- Borrow ideas for producing “verifier-grade” evidence artifacts (per-indicator tables).

---

## 2) OCDSKit (Python) — `open-contracting/ocdskit`
Repo: https://github.com/open-contracting/ocdskit

### Why it’s useful
- Strong reference for **CLI architecture** + **data packaging workflows**.
- Contains utilities that are adjacent to “investigation as code”: format detection, packaging, merging/splitting, upgrading versions.

### What to look for
- CLI structure: command layout, argument parsing, subcommands, help text.
- File/pipeline conventions: how they structure IO, logs, errors, return codes.
- Determinism practices: reproducible outputs, stable ordering, schema validation.
- Any patterns for “compiled releases”, “versioned releases”, or working with large JSON packages.

### How we might use it
- Copy the **CLI ergonomics**:
  - `investigate --target ... --snapshot ... --out case/`
  - structured logs + consistent exit codes
- Reuse mental model for “package → normalize → analyze → export”.
- Potentially vendor small utility ideas (not code) for:
  - file detection, directory conventions, schema checks.

---

## 3) Kingfisher Collect (Python) — `open-contracting/kingfisher-collect`
Repo: https://github.com/open-contracting/kingfisher-collect

### Why it’s useful
- Reference for **robust data collection at scale**:
  - downloading datasets,
  - storing locally,
  - handling repeatable runs and operational concerns.
- Closest “style match” to our ingestion needs: resilient retrieval, structured storage, and predictable snapshots.

### What to look for
- Networking resiliency:
  - retries, backoff, throttling patterns, checkpointing.
- Snapshot strategy:
  - filesystem layout for downloads,
  - metadata/provenance storage,
  - idempotent re-runs.
- Abstraction boundaries:
  - collector modules, configuration, separation of concerns.

### How we might use it
- Use as blueprint for `ingest/`:
  - request caching keyed by payload hash
  - page-wise retrieval with checkpoints
  - “offline mode” from cached snapshots
- Mirror dataset folder structure:
  - `data/raw/`, `data/normalized/`, `provenance.json`, run manifests.

---

## Practical takeaways for our implementation
- **cardinal-rs** informs the *indicator engine & definitions*.
- **ocdskit** informs the *CLI UX and OCDS data handling conventions*.
- **kingfisher-collect** informs the *ingestion/snapshot/reproducibility mechanics*.

## Suggested code-discovery tasks for the agent
- Identify 2–3 implementation patterns per repo:
  - “how indicators are parameterized” (Cardinal)
  - “how CLI commands are structured” (OCDSKit)
  - “how downloads/snapshots are made reproducible” (Kingfisher Collect)
- Extract reusable conventions (not necessarily code):
  - folder layout, naming, metadata schema, logging conventions
- Map patterns to our modules:
  - `ingest/`, `normalize/`, `rules/`, `evidence/`, `report/`, `verify/`
