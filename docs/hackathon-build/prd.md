# Product Requirements Document

## Product Summary

This product is a human-agent investigation workbench for solo, early-career machine-learning researchers. It helps a researcher determine whether two experiment results are valid to compare, inspect the evidence behind an agent's criticism, add context the records do not contain, and approve a precise plan for resolving the remaining uncertainty.

The product is not another general experiment tracker. Runs, metrics, parameters, and artifacts are evidence. The primary durable object is an investigation: the question the researcher was trying to answer, the selected runs, the comparability findings, the researcher's challenges, the proposed response, and the exact decision they approved.

The experience should feel like a lab control room with the researcher at its center. The agent behaves as a neutral auditor. It can inspect, explain, criticize, and draft, but it never silently turns incomplete analysis into a conclusion or a proposal into an approved decision.

## Product Goals

1. Make hidden comparability problems visible before a researcher commits more time or compute.
2. Let researchers verify agent claims from original records rather than trusting prose alone.
3. Preserve researcher context without allowing that context to erase factual limitations.
4. Make the transition from apparent improvement to defensible next action visible and durable.
5. Demonstrate a collaboration that is materially stronger because an external agent and a human share the same live workspace through WebMCP.

## Product Principles

- **Evidence before confidence.** Missing information lowers confidence and stays visible.
- **Source records remain honest.** Assumptions and normalized labels never overwrite imported evidence.
- **The researcher decides.** Analysis and drafts may be generated, but durable conclusions and approvals require explicit human action.
- **Warnings inform rather than seize control.** A researcher may approve a limited plan after specifically acknowledging its consequence.
- **Failures preserve context, not conclusions.** Interrupted work can be resumed deliberately, while partial output remains provisional.
- **Progressive disclosure.** New researchers receive guidance first and can transition to denser tables and evidence views.

## Target User

The primary user is a solo third- or fourth-year undergraduate or graduate ML researcher who already produces experiment records but does not have a reliable system for reconstructing what differs between runs or why a research decision was made.

They may have CSV metric exports, JSON or YAML configurations, candidate manifests, checkpoints or checkpoint references, retrieval examples, preprocessing notes, and results copied from papers. Their records are useful but inconsistent. They are comfortable interpreting evidence and spotting mistakes, yet benefit from an agent that can systematically inspect the workspace and propose follow-up experiments.

The MVP supports a private, account-backed workspace. It does not support shared teams, organizational permissions, or real-time collaboration.

## Core User Journey

1. A new researcher sees one primary **Import experiment** action and an optional, disposable walkthrough.
2. The walkthrough demonstrates the complete decision loop with prepared Run A and Run B records, then directs the researcher to import their own work.
3. The researcher uploads a documented retrieval-experiment package. The product reviews what it recognized, what is missing, what is ambiguous, what is duplicated, and which audits are possible.
4. The researcher confirms the valid portion of the import. Original provenance remains inspectable, and unresolved warnings follow the affected records.
5. The researcher lands in a guided run-selection view and can switch to a denser control-room table.
6. They select exactly two runs and ask whether an apparent improvement justifies more investment.
7. An external agent uses WebMCP to inspect the selected runs and initiate a comparability audit. The page shows understandable progress rather than a raw tool transcript.
8. The audit reports that Run A's Recall@5 is 84% and Run B's is 76%, but finds that Run A used 200 candidates per query while Run B used 1,000.
9. The researcher opens the finding and verifies the highlighted difference in side-by-side source evidence. The scores remain visible, but direct model ranking is qualified.
10. The researcher explains that Run A was intentionally a quick sanity check. The agent previews a revised interpretation: the result is valid for that purpose but cannot establish superiority over the baseline. The researcher confirms before saving it.
11. The agent proposes a controlled reevaluation. The researcher edits it, reviews any warnings, and approves an exact version.
12. The investigation list now preserves the question, evidence, challenge, proposal history, approval state, and rationale so the researcher can return without reconstructing the decision.

## Epics And User Stories

### Epic 1: Learn the Decision Model

#### Story 1.1 — First-run entry

As a new researcher, I want one obvious way to bring in my experiments so that I am not forced to understand the full interface before receiving value.

Acceptance criteria:

- A new account presents **Import experiment** as the primary action.
- The page also offers a clearly secondary walkthrough option.
- The empty state explains that records are not assumed comparable merely because they contain metrics.
- Audit and investigation actions are unavailable when zero runs exist, with guidance explaining what to import next.
- The researcher can leave and return without an empty or invented experiment being created.

#### Story 1.2 — Disposable walkthrough

As a new researcher, I want to experience the complete investigation loop with safe example data so that I understand the product before importing private work.

Acceptance criteria:

- The walkthrough is clearly labeled as a demo environment.
- It demonstrates: select runs → request audit → inspect mismatch → challenge interpretation → review proposed reevaluation.
- It teaches the decision model rather than attempting to explain every control.
- It is skippable at any point and replayable later.
- Demo records do not appear in the user's run table, investigations, activity history, or storage by default.
- A separate **Copy this example into my workspace** action explains what will be copied and requires explicit confirmation.
- Completing or skipping the walkthrough leads directly to importing the researcher's own experiments.

### Epic 2: Import Records Without Inventing Certainty

#### Story 2.1 — Review a prepared experiment package

As a researcher, I want to review what the product recognized before records are created so that I can correct mistakes and understand audit limitations.

Acceptance criteria:

- The MVP accepts the documented retrieval-experiment package and identifies its runs, metrics, parameters, configurations, artifacts, and relationships.
- The review lists every received file and the run or artifact relationship proposed for it.
- The review visibly separates recognized records, missing fields, ambiguous relationships, validation errors, and unsupported files.
- Each proposed record shows its original filename, source, import time, and content identity where available.
- Each run receives an audit-readiness summary explaining which checks can and cannot be performed.
- No proposed grouping becomes a permanent record until the researcher confirms the import.
- The researcher can manually resolve an ambiguous relationship or leave it unresolved.
- Unresolved information remains visible after import and is not silently replaced by a guessed value.

#### Story 2.2 — Import the valid remainder

As a researcher, I want useful records to survive a partially unsuccessful import so that one bad file does not block the rest of my work.

Acceptance criteria:

- A review with at least one valid run allows the valid portion to be confirmed.
- The confirmation summarizes which records will be created and which warnings will remain.
- Invalid or unsupported files remain associated with the import attempt for later correction.
- The product creates no fabricated runs, placeholder metrics, or invented relationships to make the import appear complete.
- Affected runs retain visible completeness and audit-readiness warnings in later views.

#### Story 2.3 — Recover from a zero-run import

As a researcher, I want a failed import to explain what was received and how to fix it so that I can retry without starting over blindly.

Acceptance criteria:

- If no valid run can be constructed, no experiment or run record is created.
- The import attempt records files received, recognized file types, validation errors, why no runs were constructed, expected package structure, and suggested corrections.
- A message uses concrete evidence, such as: “No valid runs were created. We found three metric files but could not associate them with run identifiers or configurations.”
- The attempt appears in a separate import activity log, not in the run table.
- The researcher can replace or remap files and retry from the attempt.
- An example manifest or package skeleton is available from the failure view.

#### Story 2.4 — Handle duplicate content and distinct provenance

As a researcher, I want identical content to be reused without losing the meaning of a new import event so that storage efficiency does not erase provenance.

Acceptance criteria:

- An exact content match is labeled as an exact duplicate during import review.
- **Reuse existing artifact** is selected by default.
- The review names the existing artifact and explains that the new run can attach to it without storing its content again.
- The attempted import, source location, filename, and intended relationship remain visible even when existing content is reused.
- **Import as a separate record** is available when distinct provenance is useful.
- Separate artifact records may retain different names, sources, and import events while identifying that their underlying content matches.
- No duplicate is silently discarded.

#### Story 2.5 — Use limited generic imports honestly

As a researcher, I want basic CSV or JSON records to remain useful even when they do not match the prepared package so that I can inspect them without receiving exaggerated audit claims.

Acceptance criteria:

- Generic CSV or JSON import is labeled as limited or best-effort.
- The review shows exactly which fields and relationships were recognized.
- Audit readiness reflects missing manifests, configurations, or identifiers.
- The product does not promise candidate-pool verification when recorded candidate inputs are unavailable.

### Epic 3: Operate the Run Control Room

#### Story 3.1 — Move from guidance to dense inspection

As a new researcher, I want a guided selection experience that can expand into detailed tables so that I can begin confidently without losing expert-level visibility.

Acceptance criteria:

- After import, the first view explains how to choose evidence for an investigation.
- The researcher can switch explicitly to a denser run table.
- The dense view supports sorting, pinned key metrics, side-by-side configuration inspection, and small artifact previews.
- Switching views preserves the current selection.
- The interface never labels the numerically highest score as the best model before comparability is established.

#### Story 3.2 — Select a valid comparison pair

As a researcher, I want the product to make the comparison scope explicit so that the agent and I reason about the same runs.

Acceptance criteria:

- A workspace may contain many runs.
- A comparability investigation requires exactly two selected runs.
- With zero runs, the product directs the researcher to import.
- With one run, the product offers a limited completeness/readiness review and explains that another run is needed for comparison.
- If more than two runs are selected, the product asks the researcher to choose a pair before starting the audit.
- The active pair remains visibly named while the agent works.
- The researcher's decision question is displayed with the selected pair.

### Epic 4: Collaborate With an External Agent Through WebMCP

#### Story 4.1 — Share live investigation context

As a researcher, I want my agent to understand the runs and evidence currently selected on the page so that I do not have to paste identifiers, configurations, or artifacts into chat.

Acceptance criteria:

- An external agent can inspect the current selected-run context through the app's WebMCP capabilities.
- The interface makes the scope visible as **Comparing Run A and Run B** or equivalent.
- Agent-facing inspection does not change records or create a durable finding.
- If the selection changes, the page and subsequent agent actions reflect the new scope rather than silently continuing against old context.

#### Story 4.2 — Start and follow a comparability audit

As a researcher, I want to see what the agent is checking in understandable language so that I can follow and redirect the investigation.

Acceptance criteria:

- An audit can be initiated through the WebMCP collaboration flow against the selected pair.
- The page shows meaningful stages such as **Checking evaluation settings** and **Inspecting candidate manifests**.
- Raw internal tool-call detail is not required for the primary progress view.
- Audit output remains temporary until the researcher chooses **Save finding and create investigation**.
- Dismissing a completed temporary analysis creates no durable finding or investigation conclusion.
- The agent can retrieve the cited evidence needed to explain a finding.

#### Story 4.3 — Preserve an interrupted audit without promoting it

As a researcher, I want failed agent work to preserve my setup without masquerading as a conclusion so that I can retry safely.

Acceptance criteria:

- An interrupted attempt retains the selected runs, research question, completed progress indicators, failure point, and safe diagnostic details.
- The working investigation is labeled **Interrupted**.
- Any partial conclusion is visibly provisional and excluded from the durable findings record.
- No agent action restarts automatically when the researcher returns.
- Retry creates a new audit revision while preserving the interrupted attempt.
- A retry rechecks that the selected runs and evidence have not changed.
- The prior completed progress may remain visible for context, but the product does not claim to resume an internal execution step.

#### Story 4.4 — Handle changed selection without losing reasoning

As a researcher, I want analysis made for an old run selection to remain inspectable but not current so that useful reasoning is not erased or misapplied.

Acceptance criteria:

- Changing either selected run marks the current temporary analysis **Stale**.
- A stale notice states that the analysis was generated for a different selection.
- Stale analysis cannot be approved or promoted as current evidence.
- The researcher can save it as a stale draft, restore the original selection, rerun for the new selection, or discard it.
- Rerunning creates a new analysis revision and does not overwrite the stale one.

### Epic 5: Verify Comparability Findings

#### Story 5.1 — Detect the candidate-pool mismatch deeply

As a researcher, I want the audit to compare recorded evaluation inputs as well as configurations so that an apparent improvement is not accepted on incompatible evidence.

Acceptance criteria:

- The hero audit displays Run A's Recall@5 of 84% and Run B's 76% without hiding or replacing either score.
- It identifies that Run A used 200 candidate images per query while Run B used 1,000.
- The finding states that the recorded results do not establish a direct model ranking under matched conditions.
- When candidate manifests exist, the finding cites their recorded counts rather than relying only on declared configuration.
- If recorded inputs and configuration disagree, the product creates a separate unresolved inconsistency rather than choosing one silently.
- A retrieval example can show plausible distractors present in one candidate pool and absent from the other.
- The explanation distinguishes illustration from causal quantification; it does not claim how much of the eight-point gap the pool mismatch caused.

#### Story 5.2 — Inspect side-by-side evidence

As a researcher, I want every finding linked to its source evidence so that I can verify the agent's reasoning myself.

Acceptance criteria:

- Opening a finding places the relevant Run A and Run B records side by side.
- Differing fields are highlighted with enough surrounding context to interpret them.
- Each citation identifies whether it comes from declared configuration or recorded inputs.
- The finding displays severity, status, evidence references, and confidence.
- Missing evidence produces a visible warning and lower confidence rather than disappearing from the analysis.
- The researcher can open the original imported record or artifact represented by a citation when it remains available.

#### Story 5.3 — Keep incomplete findings actionable

As a researcher, I want a cautious finding even when evidence is incomplete so that I can decide how to resolve the uncertainty.

Acceptance criteria:

- A lower-confidence finding names the missing evidence and the conclusion that remains unsupported.
- It distinguishes what is observed, what is declared, and what is unknown.
- It may propose obtaining or recreating missing evidence.
- A value copied from another run is never presented as evidence about the original run.
- A copied value may appear only as a labeled assumption in a draft reevaluation plan and requires researcher confirmation.
- Confirming an assumption does not modify the imported source record or raise the finding's evidence confidence.

#### Story 5.4 — Perform lighter mismatch checks

As a researcher, I want the audit to flag other obvious incompatibilities so that the candidate-pool check does not imply the rest of the comparison is safe.

Acceptance criteria:

- The audit checks available evaluation split identifiers, preprocessing descriptions, and metric definitions for mismatches.
- These checks clearly indicate when they are based only on names or declarations.
- Matching labels such as `R@5` and `recall_at_5` do not establish equivalent calculations by themselves.
- A lighter check never presents itself as manifest-verified evidence when the supporting artifact is absent.

### Epic 6: Challenge and Confirm Agent Interpretations

#### Story 6.1 — Save the first durable finding deliberately

As a researcher, I want temporary analysis to become a finding only after review so that the permanent investigation record contains conclusions I chose to retain.

Acceptance criteria:

- A completed temporary analysis offers **Save finding and create investigation** as its primary durable action.
- The action previews the finding, selected runs, citations, confidence, and current question.
- Confirming creates the investigation and its first finding.
- Dismissing the analysis leaves no durable finding.
- No partial or failed conclusion can use the save action as if it were complete.

#### Story 6.2 — Challenge without erasing the limitation

As a researcher, I want to add context and challenge an agent's interpretation so that the investigation reflects both recorded evidence and research intent.

Acceptance criteria:

- The researcher can provide a challenge or clarification in their own words.
- The agent previews a revised interpretation before anything is saved.
- The preview shows what changed and which factual limitation remains.
- A statement such as “the smaller pool was an intentional sanity check” may revise the conclusion to “valid sanity-check result; unsuitable for direct baseline comparison.”
- The challenge does not edit or delete original evidence.
- A second explicit confirmation saves the challenge and revised interpretation.
- The durable record preserves the prior finding revision, the researcher response, the revised wording, actor, and timestamp.

### Epic 7: Turn Uncertainty Into an Approved Plan

#### Story 7.1 — Draft a controlled reevaluation

As a researcher, I want the agent to propose a precise experiment that resolves the identified uncertainty so that the next use of compute answers a decision-relevant question.

Acceptance criteria:

- The proposal begins with the research question it is intended to answer.
- It separates variables that remain fixed from variables that change.
- It identifies selected checkpoints or references, evaluation queries, candidate pool, preprocessing, metric definition, required artifacts, resource constraints, and decision threshold when available.
- It shows which inputs are ready, missing, or assumed.
- A missing required artifact does not prevent drafting, but the plan is labeled not ready to execute or hand off.
- A copied default is labeled with its source, such as **Assumed from Run B**, and requires confirmation.
- The proposal remains a draft until the researcher explicitly saves or approves it.

#### Story 7.2 — Edit while preserving the intended comparison

As a researcher, I want immediate feedback on plan edits so that I understand whether my constraints change what the experiment can conclude.

Acceptance criteria:

- The researcher can edit plan fields before approval.
- An operational edit such as batch size does not automatically invalidate the comparison.
- An edit that changes only one run's candidate pool or otherwise recreates a mismatch produces a prominent, specific warning.
- The warning states what conclusion the edited plan can no longer support.
- The researcher remains allowed to proceed; the product does not silently revert the edit.

#### Story 7.3 — Approve an exact version

As a researcher, I want approval tied to the exact proposal I reviewed so that later edits cannot inherit permission.

Acceptance criteria:

- The approval view summarizes the exact plan version and its unresolved warnings.
- A normal plan uses a clear **Approve plan** action.
- A plan with a decision-relevant unresolved limitation requires a specific acknowledgment and a distinct **Approve with limitation** action.
- The acknowledgment names the exact limitation and consequence rather than presenting a generic checkbox.
- The researcher may add an approval rationale.
- The approval record includes the exact version, warnings accepted, rationale, actor, and timestamp.
- Informational warnings remain visible but do not add approval friction.
- Approval grants no permission for future plans or autonomous experimentation.

#### Story 7.4 — Preserve immutable approval history

As a researcher, I want approved plans to remain unchanged while allowing later revisions so that the decision history is trustworthy.

Acceptance criteria:

- An approved plan version cannot be edited in place.
- Choosing to edit after approval creates a new draft version.
- The prior approved version, timestamp, warnings, and rationale remain visible.
- The investigation clearly distinguishes the currently approved version from any newer unapproved draft.

### Epic 8: Return, Manage, and Delete Responsibly

#### Story 8.1 — Resume from the investigation list

As a returning researcher, I want to see unfinished decisions first so that I can continue without reconstructing context from a run dashboard.

Acceptance criteria:

- After sign-in, the default home is the investigation list.
- The list can visibly distinguish **Unresolved**, **Interrupted**, **Stale**, **Proposal ready**, **Approved**, **Approved with limitation**, **Resolved**, and **Archived**.
- Opening an investigation restores selected runs, question, evidence panels, saved conversation or challenges, and proposal edits.
- It restores the logical working section but does not promise exact scroll position or transient interface state.
- No agent activity, approval, job, or durable promotion resumes automatically.
- The next active action is explicit and visible.

#### Story 8.2 — Keep run and investigation lifecycles separate

As a researcher, I want to remove or archive a run without silently destroying past decisions so that my investigation history remains trustworthy.

Acceptance criteria:

- Attempting to delete a referenced run names every affected investigation.
- **Archive the run** is presented as the recommended option.
- The researcher may remove the live run while preserving a read-only evidence snapshot in its investigations.
- Permanent deletion explains exactly which evidence will become unavailable and requires explicit confirmation.
- Permanent deletion redacts the requested source evidence but preserves the investigation shell, former evidence role, conclusions, approvals, timestamps, and deletion event.
- An investigation is deleted only through its own separate deletion action.
- References visibly distinguish live source, evidence snapshot, and unavailable source.

## Investigation And Finding States

The following labels must communicate observable product meaning:

- **Unresolved:** a saved finding exists, but no resolution decision has been approved.
- **Interrupted:** an audit attempt failed or stopped before a complete finding was saved.
- **Stale:** selected runs or relevant evidence changed after an analysis revision.
- **Proposal ready:** a resolution plan awaits review or approval.
- **Approved:** an exact plan version was approved without a decision-relevant retained limitation.
- **Approved with limitation:** an exact plan version was approved after a specific warning was acknowledged.
- **Resolved:** follow-up evidence has answered the investigation; the state exists in the model, but ingesting follow-up results is outside the MVP flow.
- **Archived:** the investigation remains available but is intentionally inactive.

Findings use the smaller lifecycle defined for the MVP: **detected → challenged or acknowledged → accepted limitation or resolved**. Investigation state and finding state must not be presented as interchangeable.

## Edge Cases And Required Responses

- **Zero runs:** show import guidance; do not offer a comparison audit.
- **One run:** offer a limited completeness review and explain that two runs are needed for comparability.
- **More than two selected:** require the researcher to choose a pair.
- **No valid import:** preserve a failed import attempt; create no run.
- **Partially valid import:** allow confirmed valid records and retain warnings for the remainder.
- **Duplicate content:** reuse content by default while preserving import provenance.
- **Missing manifest:** allow a lower-confidence finding based on available declarations, labeled accordingly.
- **Configuration conflicts with manifest:** preserve both and create an explicit inconsistency.
- **Selection changes during analysis:** mark the analysis stale and disable approval as current evidence.
- **Audit interruption:** preserve the working setup and progress; save no incomplete finding.
- **Return after interruption:** show a retry action; never restart automatically.
- **Plan edit recreates mismatch:** warn specifically but preserve researcher authority to approve with limitation.
- **Edit after approval:** create a new draft; never mutate the approved version.
- **Referenced run deletion:** warn, offer archive or snapshot preservation, and never cascade-delete the investigation.
- **Deleted evidence:** preserve the evidence's former role and the deletion event without retaining content the researcher chose to remove.

## What We Are Building For The Hackathon

- Disposable first-run walkthrough using the prepared comparison.
- Private persistent workspace and returning investigation list.
- Full-fidelity import for one documented retrieval package.
- Limited generic CSV/JSON import with honest readiness labeling.
- Import review, partial-success behavior, activity log, provenance, and exact-duplicate handling.
- Guided run selection plus a focused dense control-room view.
- Exactly-two-run investigations and a one-run completeness state.
- WebMCP collaboration for inspecting selected runs, starting audits, retrieving evidence, recording confirmed challenges, drafting resolution plans, and presenting exact plans for approval.
- Deep candidate-pool mismatch detection and evidence inspection.
- Lighter evaluation-split, preprocessing, and metric-definition checks.
- Temporary analysis, explicit first-finding save, human challenge preview, and confirmation.
- Versioned reevaluation plans, warnings, approval, and approval-with-limitation records.
- Interrupted and stale analysis behavior that preserves context without promoting conclusions.
- Separate run and investigation lifecycle behavior.
- Dark technical interface; warm theme only after the protected demo path is stable.

## What We Would Add With More Time

- GitHub-link, W&B, MLflow, cloud-storage, and arbitrary-folder imports.
- More flexible manual schema mapping and richer import correction tools.
- Open-ended single-run project brainstorming beyond completeness review.
- Multi-run or cohort investigations beyond one selected pair.
- A broader library of statistical, dataset, leakage, reproducibility, and task-specific audit rules.
- Follow-up-result ingestion and automatic transition to **Resolved**.
- Runnable evaluation configuration export, remote execution, queues, and compute connections.
- Team workspaces, permissions, comments, and collaborative review.
- Rich dashboard customization and additional visualization modes.
- Smarter retry that reuses safe internal audit steps.
- Exact restoration of transient interface position.
- A complete finding-state workflow and policy controls.

## Non-Goals

- Do not infer that matching metric names imply matching implementations.
- Do not generate source evidence, fill missing records, or silently normalize uncertainty away.
- Do not determine how much a mismatch caused a metric gap without a valid evaluation.
- Do not automatically approve, execute, or resume experiments.
- Do not become a replacement for general experiment tracking.
- Do not require remote execution for the product's central value.
- Do not delete investigation history merely because a referenced run changes lifecycle.

## Submission Proof Points

The demo and submission should prove the following observable claims:

1. **WebMCP leverage:** an external agent begins from the runs selected in the live page, inspects evidence, and returns findings and a proposal into the same investigation workflow.
2. **Human-agent collaboration:** the researcher challenges the agent, sees the interpretation change, and explicitly controls the durable finding and plan.
3. **Inspectable trust:** clicking the central mismatch opens the two source records and identifies recorded-input evidence separately from declared configuration.
4. **Meaningful consequence:** the page changes from apparent winner to qualified comparison without hiding either metric.
5. **Researcher authority:** a plan can be edited and even approved with a limitation, but only through a specific acknowledgment tied to an exact version.
6. **Reliability:** incomplete imports, interrupted audits, stale analysis, and missing evidence never become invisible or fabricated conclusions.
7. **Impact:** the final investigation turns an unsupported decision into a defensible next action and preserves why that action was chosen.

## MVP Success Criteria

The MVP is successful when a judge can watch the prepared three-minute path and verify that:

- the app imports or presents authentic experiment records with provenance;
- the human and agent share the current run selection through WebMCP;
- the candidate-pool mismatch is found and proven from inspectable evidence;
- the researcher can challenge the interpretation without erasing the limitation;
- the agent can draft a controlled reevaluation plan;
- the researcher can approve an exact version, including a specific limitation acknowledgment when necessary; and
- the resulting investigation remains understandable after leaving and returning.

The 36-hour build should protect these criteria before adding optional theme polish, extra charts, generic-format breadth, or additional audit rules.
