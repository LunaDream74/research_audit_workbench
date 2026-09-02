import type { PlanValidation } from "./investigation";

export type JarvisActionKind =
  | "select_runs"
  | "run_audit"
  | "inspect_evidence"
  | "save_finding"
  | "stage_challenge"
  | "confirm_challenge"
  | "stage_plan"
  | "fix_plan"
  | "save_plan"
  | "approve_plan"
  | "complete";

export type JarvisReviewInput = {
  pairReady: boolean;
  auditComplete: boolean;
  evidenceInspected: boolean;
  findingSaved: boolean;
  challengePreviewed: boolean;
  challengeConfirmed: boolean;
  planDrafted: boolean;
  planValidation: PlanValidation | null;
  digestReady: boolean;
  approved: boolean;
};

export type JarvisSuggestion = {
  id: JarvisActionKind;
  priority: "now" | "next" | "later";
  title: string;
  reason: string;
  humanRequired: boolean;
};

export type JarvisReview = {
  schemaVersion: "1.0";
  score: number;
  phase: "scope" | "audit" | "evidence" | "interpretation" | "resolution" | "approved";
  summary: string;
  nextAction: JarvisSuggestion;
  suggestions: JarvisSuggestion[];
  strengths: string[];
  authorityBoundary: string;
};

const suggestionCatalog: Record<Exclude<JarvisActionKind, "complete">, Omit<JarvisSuggestion, "priority">> = {
  select_runs: {
    id: "select_runs",
    title: "Lock the comparison scope",
    reason: "The assistant needs exactly two runs before it can compare evidence without mixing contexts.",
    humanRequired: true,
  },
  run_audit: {
    id: "run_audit",
    title: "Audit comparability before ranking",
    reason: "The recorded score gap is visible, but its evaluation conditions have not been checked yet.",
    humanRequired: false,
  },
  inspect_evidence: {
    id: "inspect_evidence",
    title: "Inspect the recorded source values",
    reason: "The finding should be traced to manifests and hashes before it influences a durable decision.",
    humanRequired: false,
  },
  save_finding: {
    id: "save_finding",
    title: "Decide whether this finding belongs in the record",
    reason: "The audit is still temporary. Only the researcher can create the durable investigation.",
    humanRequired: true,
  },
  stage_challenge: {
    id: "stage_challenge",
    title: "Compare the finding with researcher context",
    reason: "A reversible revision can test whether the interpretation changes while the evidence remains intact.",
    humanRequired: false,
  },
  confirm_challenge: {
    id: "confirm_challenge",
    title: "Review and confirm the revised interpretation",
    reason: "The proposed wording retains the factual limitation, but it cannot enter history without the researcher.",
    humanRequired: true,
  },
  stage_plan: {
    id: "stage_plan",
    title: "Draft a matched reevaluation",
    reason: "The comparison problem is understood; the next useful step is a controlled plan that resolves it.",
    humanRequired: false,
  },
  fix_plan: {
    id: "fix_plan",
    title: "Resolve the plan's decision risk",
    reason: "The current plan has a blocking error or a mismatch that weakens the conclusion it could support.",
    humanRequired: true,
  },
  save_plan: {
    id: "save_plan",
    title: "Save the validated exact draft",
    reason: "The plan is ready, but it needs a stable version and digest before approval can bind to exact content.",
    humanRequired: true,
  },
  approve_plan: {
    id: "approve_plan",
    title: "Approve the exact next action",
    reason: "Evidence, interpretation, and validation are aligned. Final authority remains with the researcher.",
    humanRequired: true,
  },
};

const completeSuggestion: JarvisSuggestion = {
  id: "complete",
  priority: "now",
  title: "Decision package is defensible",
  reason: "The evidence trail, researcher context, validated plan, and exact approval are all present.",
  humanRequired: false,
};

function gapSequence(input: JarvisReviewInput): Array<Omit<JarvisSuggestion, "priority">> {
  if (input.approved) return [];
  const gaps: Array<Omit<JarvisSuggestion, "priority">> = [];
  if (!input.pairReady) gaps.push(suggestionCatalog.select_runs);
  if (input.pairReady && !input.auditComplete) gaps.push(suggestionCatalog.run_audit);
  if (input.auditComplete && !input.evidenceInspected) gaps.push(suggestionCatalog.inspect_evidence);
  if (input.auditComplete && input.evidenceInspected && !input.findingSaved) gaps.push(suggestionCatalog.save_finding);
  if (input.findingSaved && !input.challengePreviewed) gaps.push(suggestionCatalog.stage_challenge);
  if (input.challengePreviewed && !input.challengeConfirmed) gaps.push(suggestionCatalog.confirm_challenge);
  if (input.challengeConfirmed && !input.planDrafted) gaps.push(suggestionCatalog.stage_plan);
  if (input.planDrafted && input.planValidation?.readiness === "not_ready") gaps.push(suggestionCatalog.fix_plan);
  if (input.planDrafted && input.planValidation?.readiness === "ready_with_limitation") gaps.push(suggestionCatalog.fix_plan);
  if (input.planDrafted && input.planValidation?.readiness === "ready" && !input.digestReady) gaps.push(suggestionCatalog.save_plan);
  if (input.digestReady && !input.approved) gaps.push(suggestionCatalog.approve_plan);
  return gaps;
}

export function reviewInvestigation(input: JarvisReviewInput): JarvisReview {
  const score = [
    input.pairReady ? 10 : 0,
    input.auditComplete ? 20 : 0,
    input.evidenceInspected ? 15 : 0,
    input.findingSaved ? 10 : 0,
    input.challengePreviewed ? 5 : 0,
    input.challengeConfirmed ? 10 : 0,
    input.planDrafted ? 10 : 0,
    input.planValidation?.readiness === "ready" ? 10 : 0,
    input.digestReady ? 5 : 0,
    input.approved ? 5 : 0,
  ].reduce((total, value) => total + value, 0);

  const gaps = gapSequence(input);
  const suggestions = gaps.slice(0, 3).map((suggestion, index) => ({
    ...suggestion,
    priority: index === 0 ? "now" as const : index === 1 ? "next" as const : "later" as const,
  }));
  const nextAction = suggestions[0] ?? completeSuggestion;
  const phase = input.approved
    ? "approved"
    : input.planDrafted
      ? "resolution"
      : input.findingSaved
        ? "interpretation"
        : input.evidenceInspected
          ? "evidence"
          : input.auditComplete
            ? "audit"
            : "scope";
  const strengths = [
    input.pairReady && "Comparison scope is explicit.",
    input.auditComplete && "The ranking claim has been checked deterministically.",
    input.evidenceInspected && "Recorded evidence has been inspected.",
    input.challengeConfirmed && "Researcher context is preserved with the limitation.",
    input.planValidation?.readiness === "ready" && "The reevaluation plan is matched and valid.",
    input.approved && "Approval is bound to an exact digest.",
  ].filter((value): value is string => Boolean(value));

  return {
    schemaVersion: "1.0",
    score,
    phase,
    summary: input.approved
      ? "The current decision package is ready to hand off without granting execution authority."
      : `${score}% of the defensible-decision path is complete. ${nextAction.title} is the highest-value next step.`,
    nextAction,
    suggestions,
    strengths,
    authorityBoundary: "JARVIS may compare, critique, and stage reversible work. The researcher alone saves, confirms, and approves.",
  };
}
