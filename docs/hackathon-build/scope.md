# Project Scope

## Project Name Candidates

- To be chosen by Anh Minh; the working scope intentionally remains unnamed.

## One-Line Summary

A WebMCP-enabled investigation workbench that helps early-career ML researchers verify whether experiment runs are fairly comparable, challenge agent findings with context, and approve a versioned plan for resolving uncertainty.

## Target User

The primary user is a solo, early-career machine-learning researcher, especially a third- or fourth-year undergraduate or graduate researcher. They already run experiments but struggle to remember what each run contains, notice missing metadata, reconstruct why decisions were made, and determine whether an apparent improvement justifies more time or compute.

The MVP assumes one researcher operating a private workspace. Records persist across logins and remain editable or deletable by their owner. Team collaboration is outside the hackathon scope.

## Problem

Experiment trackers can organize runs and plot metrics, but a higher recorded score does not establish a better model. Runs may use different evaluation splits, candidate pools, preprocessing, or metric implementations. Those differences are often buried in configurations and artifacts, so researchers can build expensive follow-up work on an unsupported comparison.

The deeper problem is decision provenance. A researcher needs to know not only what ran, but why two runs were compared, what evidence challenged the comparison, how they responded, and what follow-up they approved. Having data is not the same as having comparable evidence.

## Product Thesis

The investigation—not the run—is the central durable object. An investigation joins selected runs, source evidence, audit findings, researcher challenges, proposed resolutions, approval history, and eventual outcomes.

The product should feel like a lab control room with the researcher at its center. Agents act as neutral auditors: they inspect, cite, criticize, and propose, while the researcher verifies evidence and controls every durable decision.

## Core Workflow

1. **Bring existing records.** The researcher imports a retrieval-experiment package using one documented ZIP/folder schema. A best-effort path accepts generic CSV or JSON with reduced audit capability.
2. **Review the import.** The workspace proposes run and artifact groupings, preserves original filenames, hashes, timestamps, and relationships, and exposes missing or ambiguous information before the import becomes permanent.
3. **Select evidence.** A sortable run table supports pinned metrics, side-by-side configurations, and small artifact previews. The researcher selects two runs and starts an investigation.
4. **Ask a decision question.** The hero question is: “This looks promising. Is it enough of an improvement to justify another run?” The external agent receives the page's selected-run context through WebMCP rather than requiring copied identifiers or configurations.
5. **Audit comparability.** The agent deeply checks candidate-pool comparability and performs lighter checks for evaluation split, preprocessing, and metric-definition mismatches. The interface shows meaningful activity and retains both scores while qualifying unsupported conclusions.
6. **Verify evidence.** Each finding cites inspectable source fields or artifacts. Recorded inputs outrank declared configuration; disagreement between them becomes an unresolved finding rather than being silently reconciled.
7. **Challenge the finding.** The researcher can add context such as “the smaller pool was an intentional sanity check.” The agent adapts the interpretation without deleting the limitation. MVP finding states are `detected`, `challenged` or `acknowledged`, and `accepted limitation` or `resolved`.
8. **Propose a resolution.** The agent drafts a controlled reevaluation plan containing the research question, fixed variables, changed variables, required artifacts, missing inputs, resource constraints, and decision threshold.
9. **Approve an exact version.** The researcher edits the proposal and approves only that version. The durable investigation records the original comparison, evidence, human challenge, final plan, and approval. This is the MVP's final action.

## WebMCP Collaboration Surface

The app will expose focused WebMCP tools that allow an external agent to:

- inspect the runs currently selected by the researcher;
- start a comparability audit;
- retrieve the cited source evidence for a finding;
- record a researcher-provided challenge or clarification;
- draft a resolution experiment plan; and
- submit an exact plan version for explicit human approval.

Read-only analysis and reversible drafts may occur without approval. Findings, challenges, and plans must be visibly reviewed before durable writes, and plan approval must never imply blanket authorization for future experiments.

## What We Are Building

- Account-backed persistence for user-owned experiment records and investigations.
- Import for one documented retrieval-experiment package, plus limited generic CSV/JSON import.
- Import review with provenance, proposed grouping, missing-data warnings, and ambiguity handling.
- A guided run control room that can transition into denser tables, comparison details, and visual evidence.
- A deep candidate-pool mismatch audit verified against manifests when available.
- Lighter mismatch checks for evaluation split, preprocessing, and metric definition.
- Evidence-linked findings with severity, status, confidence, and researcher responses.
- Versioned resolution-plan drafting, editing, and explicit approval.
- A dark technical default theme with a warm-aesthetic toggle if time permits after the core demo path is stable.

## What We Are Not Building

- A general-purpose experiment tracker or flexible dashboard builder.
- Reliable understanding of arbitrary experiment-folder layouts.
- Weights & Biases, MLflow, cloud-storage, or training-platform integrations.
- Multi-user teams, comments, permissions, or real-time collaboration.
- Remote job execution, queues, checkpoint hosting, or compute orchestration.
- Runnable configuration or script export for reevaluation.
- Automated training, open-ended autonomous experimentation, or blanket agent authorization.
- Exhaustive statistical validity analysis or a complete ontology for every ML task.
- A full finding workflow beyond the minimal detected-to-resolution states.

## Inspiration And References

- **Weights & Biases:** borrow rapid run selection, pinned metrics, side-by-side configurations, artifact previews, and the dense control-room feel; reject flexible dashboard sprawl.
- **MLflow:** borrow the experiment → run → parameters → metrics → artifacts hierarchy and immutable source provenance; reject an archive-first experience that loses decision rationale.
- **Evidently:** borrow explicit findings with severity, evidence, confidence, status, and test results; reject static pass/fail reports that cannot preserve researcher challenges.
- **JARVIS-style control metaphor:** preserve the emotional experience of a capable assistant surrounding the researcher with evidence while leaving the researcher visibly in command.

## Demo Path

The demo uses a prepared retrieval dataset and should fit within three minutes:

1. Import or briefly reveal two organized runs, preserving provenance and showing that the workspace has data but has not established comparability.
2. Show Run A at 84% Recall@5 and Run B at 76%; select both and ask whether A justifies further investment.
3. Let the agent use WebMCP against the current selection while the page displays meaningful audit activity.
4. Reveal that Run A used 200 candidates per query while Run B used 1,000. Keep both scores visible but remove any unsupported “best run” treatment.
5. Open the cited manifests or fields and a retrieval example showing plausible distractors present for B but absent for A.
6. Have the researcher challenge the finding: the smaller pool was an intentional sanity check. Preserve that context while changing the conclusion to “valid sanity check; unsuitable for direct baseline comparison.”
7. Let the agent draft a controlled reevaluation plan. The researcher changes one constraint, verifies the comparison remains valid, and explicitly approves the exact version.
8. End on the durable investigation record: apparent improvement qualified, evidence attached, human judgment preserved, and a defensible next action approved.

## Submission Story

Most experiment tools help researchers see which run scored higher. This project helps them determine whether that comparison supports the decision they are about to make.

WebMCP is essential because the human and external agent work from the same live investigation: the researcher selects and challenges; the agent inspects page-scoped evidence, changes the workspace presentation, and drafts a resolution; the researcher verifies citations and approves the durable outcome. The collaboration is materially stronger than either a standalone dashboard or a chat agent that receives pasted context.

The central demo transformation is simple and consequential: an unsupported research decision becomes a defensible one.

## Build Constraint And Definition Of Done

- **Time budget:** 36 focused development hours before submission.
- **Done means:** the deployed app completes the prepared import-to-approved-plan demo path, persists its core records, exposes the focused WebMCP tools, and makes every agent claim inspectable by the researcher.
- **Quality priority:** protect the evidence-backed candidate-pool audit and human approval loop before adding themes, extra charts, import formats, or audit rules.
