# Multi‑Agent Workflow Systems with Evidence and Reproducibility

## 1. Multi‑Agent Research Orchestration (Anthropic)
Recent systems like Anthropic’s *Claude Research* feature demonstrate an **orchestrator–worker paradigm** [1]. 

*   **The Workflow:** A lead **"Researcher"** agent plans an investigation and spawns multiple specialized **subagents** to search the web and databases in parallel, each focusing on different facets of the query [2]. The subagents return their findings to the lead agent, which synthesizes a final report.
*   **The Citation Layer:** Crucially, a dedicated **CitationAgent** scans the assembled answer and attaches citations for every claim, ensuring that all statements are grounded in specific sources [3].

This evidence-first approach yields answers that are transparent and fully referenced, with the entire multi-turn search process logged for reproducibility. (OpenAI’s unpublished *Deep Research* prototype took a similar approach, interleaving iterative web searches with reasoning to handle complex queries [4].)

> **Figure: A transparent multi-agent research architecture [5][6]**  
> *A lead agent decomposes the query and delegates to subagents (search, extraction, etc.), then compiles a final answer with cited evidence. Every step’s input, output, and provenance is logged for audit.*

---

## 2. Healthcare Literature Review (PubMed Agents)
In clinical medicine, evidence synthesis must be meticulous. One notable project is a healthcare multi-agent research assistant built by **Disleve Kanku** [7][6]. It uses a chain of specialized agents to answer medical questions with verifiable findings:

1.  **QueryAgent:** Translates the user’s question into a structured **PICO query** (Patient–Intervention–Comparison–Outcome) for precision [8].
2.  **SearchAgent:** Runs this query against **PubMed** and retrieves relevant studies [9].
3.  **EvidenceExtractorAgent:** Pulls out key data (population, interventions, outcomes, effect sizes, etc.) for each paper, storing findings with a reference to the source PMID [5][10].
4.  **SummarizerAgent:** Composes a concise report for the clinician with inline citations after each statement [6][11].
5.  **Orchestrator:** Manages handoffs and validates that no step proceeds without evidence.

The result is a system that never "answers" from intuition alone—it builds the answer from the ground up using excerpts of real studies. All intermediate outputs are stored (e.g., in Supabase) so researchers can retrace steps.

> "My system performs a full evidence pipeline, with logs, provenance, citations, and stateful sessions." — *Disleve Kanku* [12]

---

## 3. Legal Question Answering (L-MARS)
In the legal domain, **L-MARS** (Legal Multi-Agent Reasoning System) exemplifies an evidence-first pipeline [14][15]. It tackles legal questions by breaking them into sub-tasks:

*   **Query Decomposer (LLM):** Splits complex queries into focused sub-questions (e.g., identifying jurisdiction, time frame, key issues) [14].
*   **Search Agent:** Conducts targeted retrieval across heterogeneous sources, such as **CourtListener** for case law and web APIs for recent commentary [14].
*   **Judge Agent:** Acts as a verification module. It checks if evidence is sufficient, relevant, and up-to-date. If gaps are found, it prompts an iterative **"reasoning–search–verification"** loop [16][17].
*   **Summary Agent:** Composes the final answer only once the Judge is satisfied, citing authoritative sources.

By coordinating these roles, L-MARS "maintains coherence, filters noisy evidence, and grounds answers in authoritative law" [14].

---

## 4. Scientific Discovery Agents (SciAgents)
In scientific R&D, MIT’s **SciAgents** system showcases a workflow for autonomously generating and vetting research hypotheses [18][19]. The process mimics a research team:

1.  **Ontologist Agent:** Mines a knowledge graph to define key concepts in a target domain (e.g., bio-inspired materials) [20].
2.  **Scientist 1 Agent:** Proposes a novel hypothesis by traversing graph connections [20].
3.  **Scientist 2 Agent:** Elaborates on the proposal with experimental plans and mechanisms [20].
4.  **Reviewer Agent (Critic):** Scrutinizes the hypothesis for weaknesses and suggests improvements [20].

All content is grounded in the source graph of literature facts. The system produces detailed reports (often 8,000+ words) documenting the idea's development and references [21][22]. The code is built on Microsoft’s **AG2 (AutoGen)** framework [24][25].

---

## 5. Financial Analysis and QA
Several high-visibility projects apply multi-role agent frameworks to finance.

### TradingAgents
**TradingAgents** [26][27] is an open-source platform that emulates a collaborative trading firm:
*   **Analysts:** Roles like *Fundamental*, *Technical*, and *Sentiment Analysts* examine a stock from different angles [26].
*   **Debaters:** A pair of **Researcher** agents (one bullish, one bearish) argue the pros and cons [28][29].
*   **Decision Makers:** A **Trader** agent and **Risk Manager** agent listen to the debate to decide on an action (buy/sell/hold) [30].
Early experiments showed improved trading performance (higher Sharpe ratios) versus baseline LLM traders [31][32].

### Role-Aware QA
Proposed by Zhu et al., this framework uses three agents for educational finance questions [33]:
1.  **Base Generator:** Attempts to answer with step-by-step reasoning.
2.  **Evidence Retriever:** Pulls facts/formulas from a textbook knowledge base.
3.  **Expert Reviewer:** Acts in the role of a specific domain expert (e.g., bond analyst) to critique the draft [35][36].
This approach significantly outperformed standard LLMs in producing correct, fully explained calculations [37][38].

---

## 6. Bioinformatics Pipeline Assistant (BioAgents)
**BioAgents** [39] helps scientists design and debug bioinformatics workflows (e.g., genomic analysis). Instead of one huge model, it uses multiple fine-tuned smaller models:
*   **Tool Expert:** Specialized in bioinformatics tools and parameters.
*   **Workflow Logic Expert:** Specialized in languages like Nextflow/WDL [42].
*   **Top-Level Reasoning Agent:** Integrates outputs and cites documentation (manuals, ontologies) [41][42].

> "Two key components are necessary… reliability and transparency. Reliability ensures… accurate results, while transparency enables users to understand and trust the system’s decisions." [44]

---

## 7. Cybersecurity Threat Analysis
Researchers are using agentic workflows to map threat landscapes. A recent multi-agent RAG system analyzed over 300 academic papers and 800+ code repositories to catalog AI threats [47][50].

*   **Reader Agent:** Extracts attack tactics and vulnerabilities from papers.
*   **Ontology Agent:** Builds a graph linking threats to mitigations [47].
*   **Validation Agent:** Performs **"cross-source validation"** to ensure facts are consistent [48][49].

The result is a "living report"—an interactive threat knowledge base where every node traces back to supporting documents, uncovering previously undocumented attack techniques [52].

---

## Conclusion
Across domains—from clinical medicine to cybersecurity—a common pattern is emerging: agentic workflows with explicit roles enforce rigor. These systems share key principles:

1.  **Evidence-First Generation:** Every claim must be backed by retrieved data/citations.
2.  **Reproducibility & Provenance:** Structured logs and stored intermediate results allow for audit.
3.  **Specialization & Coordination:** Responsibilities are divided (planner, collector, verifier) rather than relying on a black-box model [8][53].

The future of complex problem-solving AI lies in multi-agent workflows that put evidence and auditability front-and-center.

---

### References

*   **[1, 2, 3]** [How we built our multi-agent research system | Anthropic](https://www.anthropic.com/engineering/multi-agent-research-system)
*   **[4, 17]** [L-MARS: Legal Multi-Agent Workflow with Orchestrated Reasoning and Agentic Search (Ar5iv)](https://ar5iv.labs.arxiv.org/html/2509.00761)
*   **[5, 6, 7, 10, 13]** [Building a Transparent Healthcare Research System with Multi-Agent Architecture | Disleve Kanku (LinkedIn)](https://www.linkedin.com/posts/disleve-kanku-m-s-44505a19a_healthcareai-agenticai-multiagentsystems-activity-7414307434023890944-_D0b)
*   **[8, 9, 11, 12, 53]** [Building Healthcare-Grade Multi-Agent Systems with Gemini - DEV Community](https://dev.to/disleve_kanku_110be436f91/building-healthcare-grade-multi-agent-systems-with-gemini-1ken)
*   **[14, 15, 16]** [L-MARS: Legal Multi-Agent Workflow with Orchestrated Reasoning and Agentic Search (arXiv)](https://arxiv.org/abs/2509.00761)
*   **[18–25]** [GitHub - lamm-mit/SciAgentsDiscovery](https://github.com/lamm-mit/SciAgentsDiscovery)
*   **[26–30]** [GitHub - TauricResearch/TradingAgents](https://github.com/TauricResearch/TradingAgents)
*   **[31, 32]** [TradingAgents: Multi-Agents LLM Financial Trading Framework (arXiv)](https://arxiv.org/abs/2412.20138)
*   **[33–38]** [A Role-Aware Multi-Agent Framework for Financial Education Question Answering with LLMs](https://arxiv.org/pdf/2509.09727)
*   **[39–46]** [BioAgents: Bridging the gap in bioinformatics analysis with multi-agent systems (PMC)](https://pmc.ncbi.nlm.nih.gov/articles/PMC12594986/)
*   **[47, 48, 49, 52]** [Multi-Agent Framework for Threat Mitigation and Resilience in AI–Based Systems (Ar5iv)](https://ar5iv.labs.arxiv.org/html/2512.23132v1)
*   **[50, 51]** [Multi-Agent Framework for Threat Mitigation and Resilience in AI-Based Systems (arXiv)](https://arxiv.org/abs/2512.23132)